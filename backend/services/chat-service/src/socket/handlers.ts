import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Conversation, Message, ConversationSettings } from '../models';
import { AuthenticatedSocket, SendMessageData, TypingData, JwtPayload } from '../types';
import { MessageStatus, MessageType } from '../types';
import { SOCKET_EVENTS, ERROR_MESSAGES } from '../constants';
import { config } from '../config';

/**
 * Setup Socket.io event handlers
 */
export const setupSocketHandlers = (io: Server): void => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error(ERROR_MESSAGES.AUTHENTICATION_ERROR));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error(ERROR_MESSAGES.AUTHENTICATION_ERROR));
    }
  });

  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join all conversation rooms
    joinUserConversations(socket, userId);

    // Handle joining a specific conversation
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, async (conversationId: string) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participantIds: userId,
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Join conversation error:', error);
      }
    });

    // Handle leaving a conversation room
    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages via socket
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data: SendMessageData) => {
      try {
        const { conversationId, content, media, replyToId, type = MessageType.TEXT } = data;

        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participantIds: userId,
        });

        if (!conversation) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.CONVERSATION_NOT_FOUND });
          return;
        }

        if (!content && (!media || media.length === 0)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.MESSAGE_CONTENT_REQUIRED });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          media,
          replyToId,
          type,
          status: MessageStatus.SENT,
          readBy: [userId],
        });

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessageId: message._id,
          lastMessageAt: message.createdAt,
        });

        // Increment unread count for other participants
        await ConversationSettings.updateMany(
          {
            conversationId,
            userId: { $ne: userId },
          },
          { $inc: { unreadCount: 1 } }
        );

        // Emit to all participants
        conversation.participantIds.forEach((participantId) => {
          io.to(`user:${participantId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, {
            conversationId,
            message,
          });
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.FAILED_TO_SEND_MESSAGE });
      }
    });

    // Handle typing indicator
    socket.on(SOCKET_EVENTS.TYPING, async (data: TypingData) => {
      try {
        const { conversationId, isTyping } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        conversation.participantIds.forEach((participantId) => {
          if (participantId !== userId) {
            io.to(`user:${participantId}`).emit(SOCKET_EVENTS.TYPING, {
              conversationId,
              userId,
              isTyping,
            });
          }
        });
      } catch (error) {
        console.error('Typing error:', error);
      }
    });

    // Handle mark as read
    socket.on(SOCKET_EVENTS.MARK_READ, async (conversationId: string) => {
      try {
        // Mark all messages as read
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: userId },
            readBy: { $ne: userId },
          },
          { $addToSet: { readBy: userId }, $set: { status: MessageStatus.READ } }
        );

        // Reset unread count
        await ConversationSettings.findOneAndUpdate(
          { conversationId, userId },
          { unreadCount: 0 }
        );

        // Emit read receipt
        const conversation = await Conversation.findById(conversationId);
        conversation?.participantIds.forEach((participantId) => {
          if (participantId !== userId) {
            io.to(`user:${participantId}`).emit(SOCKET_EVENTS.MESSAGES_READ, {
              conversationId,
              readBy: userId,
            });
          }
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle online status
    socket.on(SOCKET_EVENTS.SET_ONLINE_STATUS, (isOnline: boolean) => {
      socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS, {
        userId,
        isOnline,
        lastSeen: new Date(),
      });
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`User disconnected: ${userId}`);
      socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS, {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};

/**
 * Helper function to join all user's conversation rooms
 */
async function joinUserConversations(
  socket: AuthenticatedSocket,
  userId: string
): Promise<void> {
  try {
    const conversations = await Conversation.find({
      participantIds: userId,
    }).select('_id');

    conversations.forEach((conv) => {
      socket.join(`conversation:${conv._id}`);
    });

    console.log(`User ${userId} joined ${conversations.length} conversation rooms`);
  } catch (error) {
    console.error('Error joining conversations:', error);
  }
}

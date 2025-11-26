import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Message, Conversation, ConversationSettings } from './models';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join all conversation rooms
    joinUserConversations(socket, userId);

    // Handle joining a specific conversation
    socket.on('join_conversation', async (conversationId: string) => {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participantIds: userId,
      });

      if (conversation) {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
      }
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages via socket
    socket.on('send_message', async (data: {
      conversationId: string;
      content?: string;
      media?: any[];
      replyToId?: string;
      type?: string;
    }) => {
      try {
        const { conversationId, content, media, replyToId, type = 'TEXT' } = data;

        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participantIds: userId,
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (!content && (!media || media.length === 0)) {
          socket.emit('error', { message: 'Message content or media required' });
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
          status: 'SENT',
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
          io.to(`user:${participantId}`).emit('new_message', {
            conversationId,
            message,
          });
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', async (data: { conversationId: string; isTyping: boolean }) => {
      const { conversationId, isTyping } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      conversation.participantIds.forEach((participantId) => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('typing', {
            conversationId,
            userId,
            isTyping,
          });
        }
      });
    });

    // Handle mark as read
    socket.on('mark_read', async (conversationId: string) => {
      try {
        // Mark all messages as read
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: userId },
            readBy: { $ne: userId },
          },
          { $addToSet: { readBy: userId }, $set: { status: 'READ' } }
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
            io.to(`user:${participantId}`).emit('messages_read', {
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
    socket.on('set_online_status', (isOnline: boolean) => {
      socket.broadcast.emit('user_status', {
        userId,
        isOnline,
        lastSeen: new Date(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      socket.broadcast.emit('user_status', {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

// Helper function to join all user's conversation rooms
async function joinUserConversations(socket: AuthenticatedSocket, userId: string) {
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

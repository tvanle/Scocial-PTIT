import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Conversation, Message, ConversationSettings } from '../models';

const router = Router();

// Get conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '20' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const conversations = await Conversation.find({
      participantIds: userId,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(take);

    // Get settings and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const [settings, lastMessage] = await Promise.all([
          ConversationSettings.findOne({
            conversationId: conv._id,
            userId,
          }),
          conv.lastMessageId
            ? Message.findById(conv.lastMessageId)
            : null,
        ]);

        return {
          ...conv.toObject(),
          unreadCount: settings?.unreadCount || 0,
          isMuted: settings?.isMuted || false,
          isPinned: settings?.isPinned || false,
          lastMessage,
        };
      })
    );

    // Sort: pinned first, then by lastMessageAt
    conversationsWithDetails.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    const total = await Conversation.countDocuments({
      participantIds: userId,
    });

    res.json({
      data: conversationsWithDetails,
      meta: {
        total,
        page: parseInt(page as string),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Create conversation
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { participantIds, name, type = 'PRIVATE' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Participants required' });
    }

    const allParticipants = [...new Set([userId, ...participantIds])];

    // For private chat, check if conversation already exists
    if (type === 'PRIVATE' && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        type: 'PRIVATE',
        participantIds: { $all: allParticipants, $size: 2 },
      });

      if (existing) {
        return res.json(existing);
      }
    }

    const conversation = await Conversation.create({
      type,
      name: type === 'GROUP' ? name : undefined,
      participantIds: allParticipants,
      adminIds: type === 'GROUP' ? [userId] : [],
    });

    // Create settings for all participants
    await Promise.all(
      allParticipants.map((participantId) =>
        ConversationSettings.create({
          conversationId: conversation._id,
          userId: participantId,
        })
      )
    );

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversation by ID
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const conversation = await Conversation.findOne({
      _id: id,
      participantIds: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const settings = await ConversationSettings.findOne({
      conversationId: id,
      userId,
    });

    res.json({
      ...conversation.toObject(),
      unreadCount: settings?.unreadCount || 0,
      isMuted: settings?.isMuted || false,
      isPinned: settings?.isPinned || false,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Get messages
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { page = '1', limit = '50', before } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participantIds: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const query: any = {
      conversationId: id,
      deletedFor: { $ne: userId },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const take = parseInt(limit as string);

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(take);

    const total = await Message.countDocuments({
      conversationId: id,
      deletedFor: { $ne: userId },
    });

    res.json({
      data: messages.reverse(),
      meta: {
        total,
        hasMore: messages.length === take,
        oldestMessageDate: messages.length > 0 ? messages[0].createdAt : null,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { content, media, replyToId, type = 'TEXT' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: id,
      participantIds: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({ error: 'Message content or media required' });
    }

    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      content,
      media,
      replyToId,
      type,
      status: 'SENT',
      readBy: [userId],
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(id, {
      lastMessageId: message._id,
      lastMessageAt: message.createdAt,
    });

    // Increment unread count for other participants
    await ConversationSettings.updateMany(
      {
        conversationId: id,
        userId: { $ne: userId },
      },
      { $inc: { unreadCount: 1 } }
    );

    // Emit socket event
    const io = req.app.get('io');
    conversation.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        io.to(`user:${participantId}`).emit('new_message', {
          conversationId: id,
          message,
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete message
router.delete('/conversations/:convId/messages/:msgId', async (req: Request, res: Response) => {
  try {
    const { convId, msgId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const message = await Message.findOne({
      _id: msgId,
      conversationId: convId,
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete for everyone
    if (message.senderId === userId) {
      await Message.findByIdAndDelete(msgId);
    } else {
      // Delete only for current user
      await Message.findByIdAndUpdate(msgId, {
        $addToSet: { deletedFor: userId },
      });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Mark as read
router.post('/conversations/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId }, $set: { status: 'READ' } }
    );

    // Reset unread count
    await ConversationSettings.findOneAndUpdate(
      { conversationId: id, userId },
      { unreadCount: 0 }
    );

    // Emit read receipt
    const io = req.app.get('io');
    const conversation = await Conversation.findById(id);
    conversation?.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        io.to(`user:${participantId}`).emit('messages_read', {
          conversationId: id,
          readBy: userId,
        });
      }
    });

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Typing indicator
router.post('/conversations/:id/typing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { isTyping } = req.body;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const io = req.app.get('io');
    conversation.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        io.to(`user:${participantId}`).emit('typing', {
          conversationId: id,
          userId,
          isTyping,
        });
      }
    });

    res.json({ message: 'OK' });
  } catch (error) {
    console.error('Typing error:', error);
    res.status(500).json({ error: 'Failed to send typing indicator' });
  }
});

// Group: Add members
router.post('/groups/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;
    const { memberIds } = req.body;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'GROUP',
      adminIds: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group not found or not admin' });
    }

    await Conversation.findByIdAndUpdate(id, {
      $addToSet: { participantIds: { $each: memberIds } },
    });

    // Create settings for new members
    await Promise.all(
      memberIds.map((memberId: string) =>
        ConversationSettings.findOneAndUpdate(
          { conversationId: id, userId: memberId },
          { conversationId: id, userId: memberId },
          { upsert: true }
        )
      )
    );

    res.json({ message: 'Members added' });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// Group: Remove member
router.delete('/groups/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'GROUP',
      adminIds: userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group not found or not admin' });
    }

    await Conversation.findByIdAndUpdate(id, {
      $pull: { participantIds: memberId, adminIds: memberId },
    });

    await ConversationSettings.deleteOne({
      conversationId: id,
      userId: memberId,
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Group: Leave
router.post('/groups/:id/leave', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    await Conversation.findByIdAndUpdate(id, {
      $pull: { participantIds: userId, adminIds: userId },
    });

    await ConversationSettings.deleteOne({
      conversationId: id,
      userId,
    });

    res.json({ message: 'Left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

export default router;

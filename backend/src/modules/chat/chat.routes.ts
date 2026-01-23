import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticate } from '../../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/user/:userId', chatController.getOrCreateConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markAsRead);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

export default router;

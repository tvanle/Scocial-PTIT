import { Router } from 'express';
import { ChatController } from '../controllers';
import { authenticateUser, validate } from '../middleware';
import {
  getConversationsSchema,
  createConversationSchema,
  getConversationByIdSchema,
  getMessagesSchema,
  sendMessageSchema,
  deleteMessageSchema,
  markAsReadSchema,
  typingIndicatorSchema,
  addMembersSchema,
  removeMemberSchema,
  leaveGroupSchema,
} from '../validators';

const router = Router();
const chatController = new ChatController();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Conversation routes
router.get(
  '/conversations',
  validate(getConversationsSchema),
  chatController.getConversations.bind(chatController)
);

router.post(
  '/conversations',
  validate(createConversationSchema),
  chatController.createConversation.bind(chatController)
);

router.get(
  '/conversations/:id',
  validate(getConversationByIdSchema),
  chatController.getConversationById.bind(chatController)
);

// Message routes
router.get(
  '/conversations/:id/messages',
  validate(getMessagesSchema),
  chatController.getMessages.bind(chatController)
);

router.post(
  '/conversations/:id/messages',
  validate(sendMessageSchema),
  chatController.sendMessage.bind(chatController)
);

router.delete(
  '/conversations/:convId/messages/:msgId',
  validate(deleteMessageSchema),
  chatController.deleteMessage.bind(chatController)
);

// Conversation actions
router.post(
  '/conversations/:id/read',
  validate(markAsReadSchema),
  chatController.markAsRead.bind(chatController)
);

router.post(
  '/conversations/:id/typing',
  validate(typingIndicatorSchema),
  chatController.sendTypingIndicator.bind(chatController)
);

// Group management routes
router.post(
  '/groups/:id/members',
  validate(addMembersSchema),
  chatController.addMembers.bind(chatController)
);

router.delete(
  '/groups/:id/members/:memberId',
  validate(removeMemberSchema),
  chatController.removeMember.bind(chatController)
);

router.post(
  '/groups/:id/leave',
  validate(leaveGroupSchema),
  chatController.leaveGroup.bind(chatController)
);

export default router;

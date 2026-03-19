import { Router } from 'express';
import { datingChatController } from './dating-chat.controller';
import { authenticate, validateBody, validateParams } from '../../../middleware';
import { createDatingConversationSchema, sendDatingMessageSchema, conversationIdParamSchema } from './dating-chat.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createDatingConversationSchema), datingChatController.createConversation);
router.get('/', datingChatController.getConversations);
router.get('/:id/messages', validateParams(conversationIdParamSchema), datingChatController.getMessages);
router.post('/:id/messages', validateParams(conversationIdParamSchema), validateBody(sendDatingMessageSchema), datingChatController.sendMessage);

export default router;

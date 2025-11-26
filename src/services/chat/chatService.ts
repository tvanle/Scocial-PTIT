import { Conversation, Message, SendMessageData, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class ChatService {
  async getConversations(params?: PaginationParams): Promise<PaginatedResponse<Conversation>> {
    const response = await apiClient.get(ENDPOINTS.CHAT.CONVERSATIONS, { params });
    return response.data;
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiClient.get(ENDPOINTS.CHAT.GET_CONVERSATION(conversationId));
    return response.data;
  }

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const response = await apiClient.post(ENDPOINTS.CHAT.CREATE_CONVERSATION, { participantIds });
    return response.data;
  }

  async getMessages(conversationId: string, params?: PaginationParams): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get(ENDPOINTS.CHAT.MESSAGES(conversationId), { params });
    return response.data;
  }

  async sendMessage(conversationId: string, data: SendMessageData): Promise<Message> {
    const response = await apiClient.post(ENDPOINTS.CHAT.SEND_MESSAGE(conversationId), data);
    return response.data;
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.CHAT.DELETE_MESSAGE(conversationId, messageId));
  }

  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.CHAT.MARK_READ(conversationId));
  }

  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    await apiClient.post(ENDPOINTS.CHAT.TYPING(conversationId), { isTyping });
  }

  async createGroup(name: string, participantIds: string[], avatar?: string): Promise<Conversation> {
    const response = await apiClient.post(ENDPOINTS.CHAT.CREATE_GROUP, {
      name,
      participantIds,
      avatar,
    });
    return response.data;
  }

  async updateGroup(groupId: string, data: { name?: string; avatar?: string }): Promise<Conversation> {
    const response = await apiClient.put(ENDPOINTS.CHAT.UPDATE_GROUP(groupId), data);
    return response.data;
  }

  async addMembers(groupId: string, memberIds: string[]): Promise<void> {
    await apiClient.post(ENDPOINTS.CHAT.ADD_MEMBERS(groupId), { memberIds });
  }

  async removeMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.CHAT.REMOVE_MEMBER(groupId, memberId));
  }

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.CHAT.LEAVE_GROUP(groupId));
  }
}

export const chatService = new ChatService();
export default chatService;

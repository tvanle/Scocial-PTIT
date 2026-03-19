import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';
import type { DatingConversation, DatingMessage } from '../../types/dating';

interface MessagesResponse {
  messages: DatingMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

class DatingChatService {
  async getOrCreateConversation(otherUserId: string): Promise<DatingConversation> {
    const response = await apiClient.post(ENDPOINTS.DATING.CHAT_CONVERSATIONS, { otherUserId });
    return response.data;
  }

  async getConversations(): Promise<DatingConversation[]> {
    const response = await apiClient.get(ENDPOINTS.DATING.CHAT_CONVERSATIONS);
    return response.data;
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MessagesResponse> {
    const response = await apiClient.get(ENDPOINTS.DATING.CHAT_MESSAGES(conversationId), {
      params: params ?? {},
    });
    return response.data;
  }

  async sendMessage(conversationId: string, content: string): Promise<DatingMessage> {
    const response = await apiClient.post(ENDPOINTS.DATING.CHAT_MESSAGES(conversationId), {
      content,
    });
    return response.data;
  }
}

export const datingChatService = new DatingChatService();
export default datingChatService;

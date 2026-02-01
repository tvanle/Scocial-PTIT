import { User, UserProfile, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class UserService {
  async getProfile(): Promise<User> {
    const response = await apiClient.get(ENDPOINTS.USER.PROFILE);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put(ENDPOINTS.USER.UPDATE_PROFILE, data);
    return response.data;
  }

  async getUser(userId: string): Promise<UserProfile> {
    const response = await apiClient.get(ENDPOINTS.USER.GET_USER(userId));
    return response.data;
  }

  async searchUsers(query: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(ENDPOINTS.USER.SEARCH, {
      params: { query, ...params },
    });
    return response.data;
  }

  async follow(userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.USER.FOLLOW(userId));
  }

  async unfollow(userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.USER.UNFOLLOW(userId));
  }

  async getFollowers(userId: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(ENDPOINTS.USER.FOLLOWERS(userId), { params });
    return response.data;
  }

  async getFollowing(userId: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(ENDPOINTS.USER.FOLLOWING(userId), { params });
    return response.data;
  }

  async block(userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.USER.BLOCK(userId));
  }

  async unblock(userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.USER.UNBLOCK(userId));
  }

  async getBlockedUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(ENDPOINTS.USER.BLOCKED_USERS, { params });
    return response.data;
  }

  async uploadAvatar(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await apiClient.post(ENDPOINTS.USER.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  }

  async uploadCover(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('cover', {
      uri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    } as any);

    const response = await apiClient.post(ENDPOINTS.USER.UPLOAD_COVER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  }

  async getSuggestions(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(ENDPOINTS.USER.SUGGESTIONS, { params });
    return response.data;
  }
}

export const userService = new UserService();
export default userService;

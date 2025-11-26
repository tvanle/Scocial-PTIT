import { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class PostService {
  async getFeed(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    // const response = await apiClient.get(ENDPOINTS.POST.FEED, { params });
    // return response.data;

    // Mock implementation
    await this.simulateDelay();
    return {
      data: [],
      meta: {
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async getPost(postId: string): Promise<Post> {
    const response = await apiClient.get(ENDPOINTS.POST.GET(postId));
    return response.data;
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await apiClient.post(ENDPOINTS.POST.CREATE, data);
    return response.data;
  }

  async updatePost(postId: string, data: Partial<CreatePostData>): Promise<Post> {
    const response = await apiClient.put(ENDPOINTS.POST.UPDATE(postId), data);
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.DELETE(postId));
  }

  async likePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.LIKE(postId));
  }

  async unlikePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.UNLIKE(postId));
  }

  async getComments(postId: string, params?: PaginationParams): Promise<PaginatedResponse<Comment>> {
    const response = await apiClient.get(ENDPOINTS.POST.COMMENTS(postId), { params });
    return response.data;
  }

  async addComment(postId: string, data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post(ENDPOINTS.POST.ADD_COMMENT(postId), data);
    return response.data;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.DELETE_COMMENT(postId, commentId));
  }

  async sharePost(postId: string, content?: string): Promise<Post> {
    const response = await apiClient.post(ENDPOINTS.POST.SHARE(postId), { content });
    return response.data;
  }

  async savePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.SAVE(postId));
  }

  async unsavePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.UNSAVE(postId));
  }

  async getSavedPosts(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.SAVED, { params });
    return response.data;
  }

  async reportPost(postId: string, reason: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.REPORT(postId), { reason });
  }

  async getUserPosts(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.USER_POSTS(userId), { params });
    return response.data;
  }

  async getTrendingPosts(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.TRENDING, { params });
    return response.data;
  }

  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const postService = new PostService();
export default postService;

import { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class PostService {
  async getFeed(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.FEED, { params });
    // Backend: { success, data: { data: [], pagination: {} } }
    return response.data.data;
  }

  async getPost(postId: string): Promise<Post> {
    const response = await apiClient.get(ENDPOINTS.POST.GET(postId));
    // Backend: { success, data: Post }
    return response.data.data;
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await apiClient.post(ENDPOINTS.POST.CREATE, data);
    // Backend: { success, data: Post }
    return response.data.data;
  }

  async updatePost(postId: string, data: Partial<CreatePostData>): Promise<Post> {
    const response = await apiClient.put(ENDPOINTS.POST.UPDATE(postId), data);
    // Backend: { success, data: Post }
    return response.data.data;
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
    return response.data.data;
  }

  async addComment(postId: string, data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post(ENDPOINTS.POST.ADD_COMMENT(postId), data);
    return response.data.data;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.DELETE_COMMENT(postId, commentId));
  }

  async sharePost(postId: string, content?: string): Promise<Post> {
    const response = await apiClient.post(ENDPOINTS.POST.SHARE(postId), { content });
    return response.data.data;
  }

  async savePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.SAVE(postId));
  }

  async unsavePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.UNSAVE(postId));
  }

  async getSavedPosts(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.SAVED, { params });
    return response.data.data;
  }

  async reportPost(postId: string, reason: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.REPORT(postId), { reason });
  }

  async getUserPosts(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.USER_POSTS(userId), { params });
    // Backend returns: { success, data: { data: [], pagination: {} } }
    // We return the inner data object which matches PaginatedResponse<Post>
    return response.data.data;
  }

  async getTrendingPosts(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.TRENDING, { params });
    return response.data.data;
  }
}

export const postService = new PostService();
export default postService;

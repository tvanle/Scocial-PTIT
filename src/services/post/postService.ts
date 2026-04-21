import { Platform } from 'react-native';
import { Post, CreatePostData, Comment, CreateCommentData, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class PostService {
  async getFeed(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.FEED, { params });
    return response.data;
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
    await apiClient.delete(ENDPOINTS.POST.LIKE(postId));
  }

  async votePoll(postId: string, optionId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.VOTE(postId), { optionId });
  }

  async unvotePoll(postId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.VOTE(postId));
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

  async likeComment(commentId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.LIKE_COMMENT(commentId));
  }

  async unlikeComment(commentId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.LIKE_COMMENT(commentId));
  }

  async shareComment(commentId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.SHARE_COMMENT(commentId));
  }

  async unshareComment(commentId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.SHARE_COMMENT(commentId));
  }

  async getSharedComments(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Comment>> {
    const response = await apiClient.get(ENDPOINTS.POST.USER_COMMENT_SHARES(userId), { params });
    return response.data;
  }

  async getCommentReplies(commentId: string, params?: PaginationParams): Promise<PaginatedResponse<Comment>> {
    const response = await apiClient.get(ENDPOINTS.POST.COMMENT_REPLIES(commentId), { params });
    return response.data;
  }

  async sharePost(postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.POST.SHARE(postId));
  }

  async unsharePost(postId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.POST.UNSHARE(postId));
  }

  async getSharedPosts(userId: string, params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.USER_SHARES(userId), { params });
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

  async getUserReplies(userId: string, params?: PaginationParams): Promise<PaginatedResponse<{ comment: Comment; post: Post }>> {
    const response = await apiClient.get(ENDPOINTS.POST.USER_REPLIES(userId), { params });
    return response.data;
  }

  async getTrendingPosts(params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.POST.TRENDING, { params });
    return response.data;
  }

  async uploadMedia(uri: string, mimeType?: string): Promise<{ id: string; url: string }> {
    const formData = new FormData();

    // Detect mime type from URI or use provided mimeType
    const detectedMimeType = mimeType || this.getMimeTypeFromUri(uri);
    const extension = this.getExtensionFromMimeType(detectedMimeType);

    console.log('Upload media - uri:', uri);
    console.log('Upload media - provided mimeType:', mimeType);
    console.log('Upload media - detected mimeType:', detectedMimeType);
    console.log('Upload media - extension:', extension);

    if (Platform.OS === 'web') {
      const blob = await fetch(uri).then((r) => r.blob());
      formData.append('file', blob, `media.${extension}`);
    } else {
      formData.append('file', {
        uri,
        type: detectedMimeType,
        name: `media.${extension}`,
      } as any);
    }

    const response = await apiClient.post(ENDPOINTS.MEDIA.UPLOAD, formData, {
      headers: { 'Content-Type': undefined },
      transformRequest: (data: FormData) => data,
    });
    console.log('Upload response:', response.data);
    return { id: response.data.id, url: response.data.url };
  }

  private getMimeTypeFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    return mimeTypes[extension || ''] || 'image/jpeg';
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
    };
    return extensions[mimeType] || 'jpg';
  }
}

export const postService = new PostService();
export default postService;

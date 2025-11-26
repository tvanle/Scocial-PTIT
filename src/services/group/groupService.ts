import { Group, GroupMember, Post, CreateGroupData, PaginatedResponse, PaginationParams } from '../../types';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

class GroupService {
  async getGroups(params?: PaginationParams): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.LIST, { params });
    return response.data;
  }

  async getGroup(groupId: string): Promise<Group> {
    const response = await apiClient.get(ENDPOINTS.GROUP.GET(groupId));
    return response.data;
  }

  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await apiClient.post(ENDPOINTS.GROUP.CREATE, data);
    return response.data;
  }

  async updateGroup(groupId: string, data: Partial<CreateGroupData>): Promise<Group> {
    const response = await apiClient.put(ENDPOINTS.GROUP.UPDATE(groupId), data);
    return response.data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.GROUP.DELETE(groupId));
  }

  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.GROUP.JOIN(groupId));
  }

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.GROUP.LEAVE(groupId));
  }

  async getMembers(groupId: string, params?: PaginationParams): Promise<PaginatedResponse<GroupMember>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.MEMBERS(groupId), { params });
    return response.data;
  }

  async addMember(groupId: string, userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.GROUP.ADD_MEMBER(groupId), { userId });
  }

  async removeMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.GROUP.REMOVE_MEMBER(groupId, memberId));
  }

  async getGroupPosts(groupId: string, params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.POSTS(groupId), { params });
    return response.data;
  }

  async getPendingPosts(groupId: string, params?: PaginationParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.PENDING_POSTS(groupId), { params });
    return response.data;
  }

  async approvePost(groupId: string, postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.GROUP.APPROVE_POST(groupId, postId));
  }

  async rejectPost(groupId: string, postId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.GROUP.REJECT_POST(groupId, postId));
  }

  async searchGroups(query: string, params?: PaginationParams): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.SEARCH, {
      params: { query, ...params },
    });
    return response.data;
  }

  async getMyGroups(params?: PaginationParams): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.MY_GROUPS, { params });
    return response.data;
  }

  async discoverGroups(params?: PaginationParams): Promise<PaginatedResponse<Group>> {
    const response = await apiClient.get(ENDPOINTS.GROUP.DISCOVER, { params });
    return response.data;
  }
}

export const groupService = new GroupService();
export default groupService;

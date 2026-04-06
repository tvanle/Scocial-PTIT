import { Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';
import type {
  PaginatedResponse,
  DatingProfile,
  DatingPhoto,
  DatingPrompt,
  DatingLifestyle,
  DatingPreferences,
  CreateDatingProfileInput,
  UpdateDatingProfileInput,
  AddPhotoInput,
  UpdatePromptsInput,
  UpdateLifestyleInput,
  UpdatePreferencesInput,
  DiscoveryCard,
  DiscoveryQuery,
  SwipeInput,
  SwipeResponse,
  MatchItem,
  MatchDetail,
  MatchQuery,
  UpdateLocationInput,
  NearbyQuery,
  NearbyUserCard,
} from '../../types';

class DatingService {
  // --- Profile ---

  async createProfile(data: CreateDatingProfileInput): Promise<DatingProfile> {
    const response = await apiClient.post(ENDPOINTS.DATING.PROFILE, data);
    return response.data;
  }

  async updateProfile(data: UpdateDatingProfileInput): Promise<DatingProfile> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PROFILE, data);
    return response.data;
  }

  async getMyProfile(): Promise<DatingProfile> {
    const response = await apiClient.get(ENDPOINTS.DATING.PROFILE_ME);
    return response.data;
  }

  async getProfileByUserId(userId: string): Promise<DatingProfile> {
    const response = await apiClient.get(ENDPOINTS.DATING.PROFILE_BY_USER(userId));
    return response.data;
  }

  async addPhoto(data: AddPhotoInput): Promise<DatingPhoto> {
    const response = await apiClient.post(ENDPOINTS.DATING.ADD_PHOTO, data);
    return response.data;
  }

  async uploadMedia(uri: string): Promise<string> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blob = await fetch(uri).then((r) => r.blob());
      formData.append('file', blob, 'photo.jpg');
    } else {
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
    }

    const response = await apiClient.post(ENDPOINTS.MEDIA.UPLOAD, formData, {
      headers: { 'Content-Type': undefined },
      transformRequest: (data: FormData) => data,
    });
    return response.data.url;
  }

  async deletePhoto(photoId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.DATING.DELETE_PHOTO(photoId));
  }

  async updatePrompts(data: UpdatePromptsInput): Promise<DatingPrompt[]> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PROMPTS, data);
    return response.data;
  }

  async updateLifestyle(data: UpdateLifestyleInput): Promise<DatingLifestyle> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_LIFESTYLE, data);
    return response.data;
  }

  async updatePreferences(data: UpdatePreferencesInput): Promise<DatingPreferences> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PREFERENCES, data);
    return response.data;
  }

  async deleteProfile(): Promise<void> {
    await apiClient.delete(ENDPOINTS.DATING.DELETE_PROFILE);
  }

  // --- Discovery ---

  async getDiscovery(params?: DiscoveryQuery): Promise<PaginatedResponse<DiscoveryCard>> {
    const response = await apiClient.get(ENDPOINTS.DATING.DISCOVERY, { params: params ?? {} });
    return response.data;
  }

  // --- Swipe ---

  async swipe(data: SwipeInput): Promise<SwipeResponse> {
    const response = await apiClient.post(ENDPOINTS.DATING.SWIPE, data);
    return response.data;
  }

  async getIncomingLikes(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<DiscoveryCard>> {
    const response = await apiClient.get(ENDPOINTS.DATING.INCOMING_LIKES, { params: params ?? {} });
    return response.data;
  }

  async getSentLikes(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<DiscoveryCard>> {
    const response = await apiClient.get(ENDPOINTS.DATING.SENT_LIKES, { params: params ?? {} });
    return response.data;
  }

  async rewind(): Promise<{
    success: boolean;
    rewindedProfile: DiscoveryCard | null;
    message: string;
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.REWIND);
    return response.data;
  }

  // --- Match ---

  async getMatches(params?: MatchQuery): Promise<PaginatedResponse<MatchItem>> {
    const response = await apiClient.get(ENDPOINTS.DATING.MATCHES, { params: params ?? {} });
    return response.data;
  }

  async getMatchDetail(matchId: string): Promise<MatchDetail> {
    const response = await apiClient.get(ENDPOINTS.DATING.MATCH_DETAIL(matchId));
    return response.data;
  }

  // --- Location ---

  async updateLocation(data: UpdateLocationInput): Promise<{
    userId: string;
    latitude: number;
    longitude: number;
    locationUpdatedAt: string;
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.UPDATE_LOCATION, data);
    return response.data;
  }

  async getNearby(params?: NearbyQuery): Promise<PaginatedResponse<NearbyUserCard>> {
    const response = await apiClient.get(ENDPOINTS.DATING.NEARBY, { params: params ?? {} });
    return response.data;
  }
}

export const datingService = new DatingService();
export default datingService;

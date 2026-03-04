# Hướng Dẫn Xây Dựng Frontend - Dating Module

## 📋 Tổng Quan

Backend đã có đầy đủ Dating APIs. Tài liệu này hướng dẫn tích hợp vào mobile app React Native/Expo theo pattern hiện có.

---

## 🏗️ Kiến Trúc Hiện Tại

### Tech Stack
- **Framework**: React Native + Expo 54
- **State Management**: Zustand (primary), Redux Toolkit (legacy)
- **Data Fetching**: React Query (@tanstack/react-query)
- **HTTP Client**: Axios với interceptors
- **Navigation**: React Navigation v7
- **Token Storage**: Expo Secure Store

### Cấu Trúc Thư Mục
```
src/
├── services/          # API service classes
│   ├── api/
│   │   └── apiClient.ts    # Axios instance với interceptors
│   ├── auth/
│   ├── chat/
│   ├── user/
│   └── ...
├── constants/
│   └── api.ts        # ENDPOINTS definitions
├── store/
│   └── slices/       # Zustand stores
├── screens/          # Screen components
├── components/       # Reusable components
└── types/           # TypeScript types
```

---

## 📝 Bước 1: Thêm Dating Endpoints

**File**: `src/constants/api.ts`

```typescript
export const ENDPOINTS = {
  // ... existing endpoints ...

  // Dating Service
  DATING: {
    // Profile
    PROFILE: '/dating/profile',
    PROFILE_ME: '/dating/profile/me',
    PROFILE_BY_USER: (userId: string) => `/dating/profile/${userId}`,
    UPDATE_PROFILE: '/dating/profile',
    ADD_PHOTO: '/dating/profile/photos',
    DELETE_PHOTO: (photoId: string) => `/dating/profile/photos/${photoId}`,
    UPDATE_PROMPTS: '/dating/profile/prompts',
    UPDATE_LIFESTYLE: '/dating/profile/lifestyle',
    UPDATE_PREFERENCES: '/dating/profile/preferences',

    // Discovery
    DISCOVERY: '/dating/discovery',

    // Swipe
    SWIPE: '/dating/swipe',

    // Match
    MATCHES: '/dating/matches',
    MATCH_DETAIL: (matchId: string) => `/dating/matches/${matchId}`,
  },
};
```

---

## 📝 Bước 2: Tạo TypeScript Types

**File**: `src/types/dating.ts`

```typescript
// Dating Profile Types
export interface DatingProfile {
  id: string;
  userId: string;
  bio: string;
  isActive: boolean;
  photos: DatingPhoto[];
  prompts: DatingPrompt[];
  lifestyle: DatingLifestyle | null;
  preferences: DatingPreferences | null;
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
    dateOfBirth: string;
    gender: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DatingPhoto {
  id: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface DatingPrompt {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatingLifestyle {
  id: string;
  education: string | null;
  job: string | null;
  smoking: 'NEVER' | 'SOMETIMES' | 'REGULARLY' | null;
  drinking: 'NEVER' | 'SOMETIMES' | 'REGULARLY' | null;
  exercise: 'NEVER' | 'SOMETIMES' | 'REGULARLY' | null;
  height: number | null;
  religion: string | null;
  updatedAt: string;
}

export interface DatingPreferences {
  id: string;
  ageMin: number;
  ageMax: number;
  maxDistance: number | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  updatedAt: string;
}

// Discovery Types
export interface DiscoveryCard {
  userId: string;
  bio: string;
  photos: Array<{ url: string }>;
  user: {
    id: string;
    fullName: string;
    avatar: string | null;
    dateOfBirth: string;
    gender: string | null;
  };
}

// Swipe Types
export type SwipeAction = 'LIKE' | 'PASS';

export interface SwipeRequest {
  targetUserId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  swipe: {
    id: string;
    fromUserId: string;
    toUserId: string;
    action: SwipeAction;
    createdAt: string;
  };
  matched: boolean;
  match: DatingMatch | null;
}

// Match Types
export interface DatingMatch {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string;
  userA?: {
    id: string;
    fullName: string;
    avatar: string | null;
    dateOfBirth: string;
    gender: string | null;
  };
  userB?: {
    id: string;
    fullName: string;
    avatar: string | null;
    dateOfBirth: string;
    gender: string | null;
  };
}

export interface MatchDetail {
  id: string;
  matchedUser: {
    id: string;
    fullName: string;
    avatar: string | null;
    dateOfBirth: string;
    gender: string | null;
  };
  createdAt: string;
}

// Request Types
export interface CreateDatingProfileRequest {
  bio: string;
}

export interface UpdateDatingProfileRequest {
  bio?: string;
  isActive?: boolean;
}

export interface AddPhotoRequest {
  url: string;
  order?: number;
}

export interface UpdatePromptsRequest {
  prompts?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface UpdateLifestyleRequest {
  education?: string;
  job?: string;
  smoking?: 'NEVER' | 'SOMETIMES' | 'REGULARLY';
  drinking?: 'NEVER' | 'SOMETIMES' | 'REGULARLY';
  exercise?: 'NEVER' | 'SOMETIMES' | 'REGULARLY';
  height?: number;
  religion?: string;
}

export interface UpdatePreferencesRequest {
  ageMin: number;
  ageMax: number;
  maxDistance?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
```

**File**: `src/types/index.ts` - Export types

```typescript
// ... existing exports ...
export * from './dating';
```

---

## 📝 Bước 3: Tạo Dating Service

**File**: `src/services/dating/datingService.ts`

```typescript
import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';
import {
  DatingProfile,
  DiscoveryCard,
  SwipeRequest,
  SwipeResponse,
  DatingMatch,
  MatchDetail,
  CreateDatingProfileRequest,
  UpdateDatingProfileRequest,
  AddPhotoRequest,
  UpdatePromptsRequest,
  UpdateLifestyleRequest,
  UpdatePreferencesRequest,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

class DatingService {
  // ============ PROFILE ============

  async createProfile(data: CreateDatingProfileRequest): Promise<DatingProfile> {
    const response = await apiClient.post(ENDPOINTS.DATING.PROFILE, data);
    return response.data.data;
  }

  async getMyProfile(): Promise<DatingProfile> {
    const response = await apiClient.get(ENDPOINTS.DATING.PROFILE_ME);
    return response.data.data;
  }

  async getProfileByUserId(userId: string): Promise<DatingProfile> {
    const response = await apiClient.get(ENDPOINTS.DATING.PROFILE_BY_USER(userId));
    return response.data.data;
  }

  async updateProfile(data: UpdateDatingProfileRequest): Promise<DatingProfile> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PROFILE, data);
    return response.data.data;
  }

  async addPhoto(data: AddPhotoRequest): Promise<{ id: string; url: string; order: number }> {
    const response = await apiClient.post(ENDPOINTS.DATING.ADD_PHOTO, data);
    return response.data.data;
  }

  async deletePhoto(photoId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.DATING.DELETE_PHOTO(photoId));
  }

  async updatePrompts(data: UpdatePromptsRequest): Promise<any[]> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PROMPTS, data);
    return response.data.data;
  }

  async updateLifestyle(data: UpdateLifestyleRequest): Promise<any> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_LIFESTYLE, data);
    return response.data.data;
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<any> {
    const response = await apiClient.put(ENDPOINTS.DATING.UPDATE_PREFERENCES, data);
    return response.data.data;
  }

  // ============ DISCOVERY ============

  async getCandidates(params?: PaginationParams): Promise<PaginatedResponse<DiscoveryCard>> {
    const response = await apiClient.get(ENDPOINTS.DATING.DISCOVERY, { params });
    return response.data.data;
  }

  // ============ SWIPE ============

  async swipe(data: SwipeRequest): Promise<SwipeResponse> {
    const response = await apiClient.post(ENDPOINTS.DATING.SWIPE, data);
    return response.data.data;
  }

  // ============ MATCH ============

  async getMatches(params?: PaginationParams): Promise<PaginatedResponse<DatingMatch>> {
    const response = await apiClient.get(ENDPOINTS.DATING.MATCHES, { params });
    return response.data.data;
  }

  async getMatchDetail(matchId: string): Promise<MatchDetail> {
    const response = await apiClient.get(ENDPOINTS.DATING.MATCH_DETAIL(matchId));
    return response.data.data;
  }
}

export const datingService = new DatingService();
export default datingService;
```

**File**: `src/services/dating/index.ts`

```typescript
export { datingService, default } from './datingService';
```

---

## 📝 Bước 4: Tạo React Query Hooks

**File**: `src/hooks/useDating.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datingService } from '../services/dating';
import {
  CreateDatingProfileRequest,
  UpdateDatingProfileRequest,
  AddPhotoRequest,
  UpdatePromptsRequest,
  UpdateLifestyleRequest,
  UpdatePreferencesRequest,
  SwipeRequest,
  PaginationParams,
} from '../types';

// ============ PROFILE QUERIES ============

export const useMyDatingProfile = () => {
  return useQuery({
    queryKey: ['dating', 'profile', 'me'],
    queryFn: () => datingService.getMyProfile(),
  });
};

export const useDatingProfile = (userId: string) => {
  return useQuery({
    queryKey: ['dating', 'profile', userId],
    queryFn: () => datingService.getProfileByUserId(userId),
    enabled: !!userId,
  });
};

// ============ PROFILE MUTATIONS ============

export const useCreateDatingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatingProfileRequest) => datingService.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useUpdateDatingProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDatingProfileRequest) => datingService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useAddPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPhotoRequest) => datingService.addPhoto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => datingService.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useUpdatePrompts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePromptsRequest) => datingService.updatePrompts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useUpdateLifestyle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateLifestyleRequest) => datingService.updateLifestyle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePreferencesRequest) => datingService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'profile'] });
    },
  });
};

// ============ DISCOVERY ============

export const useDiscovery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['dating', 'discovery', params],
    queryFn: () => datingService.getCandidates(params),
  });
};

// ============ SWIPE ============

export const useSwipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SwipeRequest) => datingService.swipe(data),
    onSuccess: (response) => {
      // Invalidate discovery để loại bỏ user đã swipe
      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery'] });

      // Nếu match → invalidate matches list
      if (response.matched) {
        queryClient.invalidateQueries({ queryKey: ['dating', 'matches'] });
        // Invalidate conversations (match tạo conversation tự động)
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        // Invalidate notifications (match tạo notification tự động)
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    },
  });
};

// ============ MATCHES ============

export const useMatches = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['dating', 'matches', params],
    queryFn: () => datingService.getMatches(params),
  });
};

export const useMatchDetail = (matchId: string) => {
  return useQuery({
    queryKey: ['dating', 'matches', matchId],
    queryFn: () => datingService.getMatchDetail(matchId),
    enabled: !!matchId,
  });
};
```

---

## 📝 Bước 5: Tạo Zustand Store (Optional)

**File**: `src/store/slices/datingSlice.ts`

```typescript
import { create } from 'zustand';
import { DatingProfile, DatingMatch } from '../../types';

interface DatingState {
  currentProfile: DatingProfile | null;
  setCurrentProfile: (profile: DatingProfile | null) => void;
  clearProfile: () => void;
}

export const useDatingStore = create<DatingState>((set) => ({
  currentProfile: null,
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  clearProfile: () => set({ currentProfile: null }),
}));
```

---

## 📝 Bước 6: Tạo Screens

### 6.1. Discovery Screen

**File**: `src/screens/dating/DiscoveryScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDiscovery, useSwipe } from '../../hooks/useDating';
import { DiscoveryCard } from '../../types';

export default function DiscoveryScreen() {
  const navigation = useNavigation();
  const [page, setPage] = useState(1);
  const { data, isLoading, fetchNextPage, hasNextPage } = useDiscovery({ page, limit: '10' });
  const swipeMutation = useSwipe();

  const handleViewProfile = (userId: string) => {
    navigation.navigate('DatingProfileDetail', { userId });
  };

  const handleSwipe = async (userId: string, action: 'LIKE' | 'PASS') => {
    try {
      const result = await swipeMutation.mutateAsync({
        targetUserId: userId,
        action,
      });

      if (result.matched) {
        // Show match modal
        navigation.navigate('MatchSuccess', { match: result.match });
      }
    } catch (error) {
      console.error('Swipe error:', error);
    }
  };

  const renderCard = ({ item }: { item: DiscoveryCard }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleViewProfile(item.userId)}
    >
      <Image
        source={{ uri: item.photos[0]?.url || item.user.avatar || 'https://via.placeholder.com/300' }}
        style={styles.cardImage}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.user.fullName}</Text>
        <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe(item.userId, 'PASS')}
        >
          <Text style={styles.actionText}>PASS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe(item.userId, 'LIKE')}
        >
          <Text style={styles.actionText}>LIKE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data || []}
        renderItem={renderCard}
        keyExtractor={(item) => item.userId}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { margin: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f5f5f5' },
  cardImage: { width: '100%', height: 300 },
  cardInfo: { padding: 15 },
  cardName: { fontSize: 18, fontWeight: 'bold' },
  cardBio: { marginTop: 5, color: '#666' },
  cardActions: { flexDirection: 'row', padding: 15, gap: 10 },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  passButton: { backgroundColor: '#ccc' },
  likeButton: { backgroundColor: '#C41E3A' },
  actionText: { color: '#fff', fontWeight: 'bold' },
});
```

### 6.2. Matches Screen

**File**: `src/screens/dating/MatchesScreen.tsx`

```typescript
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMatches } from '../../hooks/useDating';
import { DatingMatch } from '../../types';

export default function MatchesScreen() {
  const navigation = useNavigation();
  const { data, isLoading } = useMatches({ page: '1', limit: '20' });

  const handleMatchPress = (match: DatingMatch) => {
    navigation.navigate('MatchDetail', { matchId: match.id });
  };

  const renderMatch = ({ item }: { item: DatingMatch }) => {
    const otherUser = item.userA || item.userB;
    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item)}
      >
        <Image
          source={{ uri: otherUser?.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{otherUser?.fullName}</Text>
          <Text style={styles.matchDate}>
            Matched {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data || []}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  matchCard: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  matchInfo: { marginLeft: 15, justifyContent: 'center' },
  matchName: { fontSize: 16, fontWeight: 'bold' },
  matchDate: { marginTop: 5, color: '#666', fontSize: 12 },
});
```

---

## 📝 Bước 7: Thêm Navigation Routes

**File**: `src/navigation/MainTabNavigator.tsx` hoặc tạo `DatingNavigator.tsx`

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoveryScreen from '../screens/dating/DiscoveryScreen';
import MatchesScreen from '../screens/dating/MatchesScreen';
import DatingProfileScreen from '../screens/dating/DatingProfileScreen';
import MatchDetailScreen from '../screens/dating/MatchDetailScreen';

const Stack = createNativeStackNavigator();

export function DatingNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Discovery" component={DiscoveryScreen} />
      <Stack.Screen name="Matches" component={MatchesScreen} />
      <Stack.Screen name="DatingProfileDetail" component={DatingProfileScreen} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
    </Stack.Navigator>
  );
}
```

---

## 📝 Bước 8: Xử Lý Real-time (Socket.io)

Khi có match mới, backend tự động tạo conversation và notification. FE chỉ cần listen Socket.io events:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../services/socket'; // Your socket instance

export function useMatchNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for new notifications (including MATCH_CREATED)
    socket.on('notification:new', (notification) => {
      if (notification.type === 'MATCH_CREATED') {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['dating', 'matches'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Show match success modal
        // navigation.navigate('MatchSuccess', { matchId: notification.referenceId });
      }
    });

    return () => {
      socket.off('notification:new');
    };
  }, [queryClient]);
}
```

---

## ✅ Checklist Implementation

- [ ] Thêm Dating endpoints vào `src/constants/api.ts`
- [ ] Tạo types trong `src/types/dating.ts`
- [ ] Tạo `src/services/dating/datingService.ts`
- [ ] Tạo React Query hooks trong `src/hooks/useDating.ts`
- [ ] Tạo Zustand store (optional) `src/store/slices/datingSlice.ts`
- [ ] Tạo screens:
  - [ ] DiscoveryScreen
  - [ ] MatchesScreen
  - [ ] DatingProfileScreen (view full profile)
  - [ ] MatchDetailScreen
  - [ ] DatingProfileEditScreen (create/edit profile)
- [ ] Thêm navigation routes
- [ ] Tích hợp Socket.io cho real-time notifications
- [ ] Test toàn bộ flow

---

## 🎨 UI/UX Recommendations

1. **Discovery Screen**: Card-based swipe UI (giống Tinder)
2. **Match Success Modal**: Hiển thị khi có match mới
3. **Profile Detail**: Full-screen với swipeable photos
4. **Matches List**: Grid hoặc list với avatar + name
5. **Chat Integration**: Từ match → navigate đến conversation

---

## 🔗 Tích Hợp Với Modules Khác

- **Chat**: Match tự động tạo conversation → navigate từ MatchDetail → ChatRoom
- **Notifications**: MATCH_CREATED notification → hiển thị trong NotificationScreen
- **User Profile**: Link từ DatingProfile → UserProfileScreen

---

## 📚 Tài Liệu Tham Khảo

- Backend API: `backend/src/modules/dating/`
- Existing patterns: `src/services/chat/`, `src/services/user/`
- React Query docs: https://tanstack.com/query/latest
- React Navigation: https://reactnavigation.org/

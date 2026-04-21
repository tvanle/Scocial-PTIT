// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  favoriteMusic?: string;
  faculty?: string;
  className?: string;
  phone?: string;
  birthday?: string;
  hometown?: string;
  currentCity?: string;
  relationship?: RelationshipStatus;
  gender?: Gender;
  isOnline?: boolean;
  lastSeen?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

export type RelationshipStatus = 'single' | 'in_relationship' | 'engaged' | 'married' | 'complicated' | 'not_specified';
export type Gender = 'male' | 'female' | 'other' | 'not_specified';

export interface UserProfile extends User {
  isFollowing?: boolean;
  isFollower?: boolean;
  isBlocked?: boolean;
  mutualFollowers?: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  studentId?: string;
  faculty?: string;
  className?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Poll Types
export interface PollOption {
  id: string;
  text: string;
  order: number;
  _count?: { votes: number };
}

export interface Poll {
  id: string;
  question?: string;
  expiresAt?: string;
  options: PollOption[];
}

export interface CreatePollOption {
  text: string;
  order?: number;
}

export interface CreatePoll {
  question?: string;
  options: CreatePollOption[];
}

// Post Types
export interface Post {
  id: string;
  author: User;
  content: string;
  media?: Media[];
  feeling?: string;
  location?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  taggedUsers?: User[];
  privacy: PostPrivacy;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
  sharedPost?: Post;
  poll?: Poll;
  createdAt: string;
  updatedAt: string;
}

export type PostPrivacy = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

export interface CreatePostData {
  content: string;
  media?: string[];
  mediaIds?: string[];
  feeling?: string;
  location?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  taggedUserIds?: string[];
  privacy: PostPrivacy;
  poll?: CreatePoll;
}

export interface Media {
  id: string;
  url: string;
  type: MediaType;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export type MediaType = 'image' | 'video' | 'audio' | 'file';

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  media?: Media;
  parentId?: string;
  replies?: Comment[];
  repliesCount: number;
  likesCount: number;
  sharesCount: number;
  isLiked: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  media?: string;
  parentId?: string;
}

// Chat Types
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = 'private' | 'group';

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content?: string;
  media?: Media[];
  replyTo?: Message;
  type: MessageType;
  status: MessageStatus;
  readBy: string[];
  createdAt: string;
  // Shared post data
  sharedPost?: {
    id: string;
    content?: string;
    author: User;
    media?: Media[];
    likesCount: number;
    commentsCount: number;
  };
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'system' | 'post';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface SendMessageData {
  content?: string;
  media?: string[];
  replyToId?: string;
  type: MessageType;
  postId?: string; // For sharing posts
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  actor: User | null;
  title: string;
  body: string;
  content?: string;
  referenceId?: string; // postId, matchId, etc.
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'MENTION'
  | 'SYSTEM'
  | 'MATCH_CREATED'
  | 'SUPER_LIKE'
  // Legacy support
  | 'like_post'
  | 'comment_post'
  | 'share_post'
  | 'follow'
  | 'follow_back'
  | 'mention'
  | 'tag'
  | 'message'
  | 'system';

// Search Types
export interface SearchResult {
  users: User[];
  posts: Post[];
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response Types (matches backend sendSuccess format)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API response wrapper for paginated data
export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: PaginatedResponse<T>;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  EditProfile: undefined;
  ChatRoom: { conversationId?: string; userId?: string };
  ChatList: undefined;
  CreatePost: undefined;
  CreatePostModal: undefined;
  ImageViewer: { images: Media[]; initialIndex: number };
  Settings: undefined;
  Security: undefined;
  Search: undefined;
  Notifications: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  DatingSplash: undefined;
  DatingOnboardingIntro: undefined;
  DatingProfileSetup: { from?: 'onboarding' | 'settings' } | undefined;
  DatingPreferencesSetup: { from?: 'onboarding' | 'settings' } | undefined;
  DatingLocationPermission: undefined;
  DatingTabs: { screen?: 'DatingDiscoverTab' | 'DatingLikesTab' | 'DatingChatsTab' | 'DatingProfileTab' } | undefined;
  DatingProfileDetail: { profile: import('./dating').DiscoveryCard };
  DatingMatch: { profile: import('./dating').DiscoveryCard; source: 'discovery' | 'detail' };
  DatingMatchSuccess: { match: import('./dating').MatchItem };
  DatingPaused: undefined;
  DatingChatRoom: {
    conversationId: string;
    otherUser?: import('./dating').DatingChatUser | null;
    prefillMessage?: string;
  };
  DatingNotifications: undefined;
  DatingSettings: undefined;
  DatingBlockedUsers: undefined;
  DatingLegal: { type: 'privacy' | 'terms' };
  DatingPremium: undefined;
  DatingPaymentResult: { vnpayParams?: Record<string, string> };
  DatingSubscription: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Messages: undefined;
  CreatePost: undefined;
  Dating: undefined;
  Profile: undefined;
  Search: undefined;
  Notifications: undefined;
};

// Dating module types
export * from './dating';

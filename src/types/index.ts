// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
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

// Post Types
export interface Post {
  id: string;
  author: User;
  content: string;
  media?: Media[];
  feeling?: string;
  location?: string;
  taggedUsers?: User[];
  privacy: PostPrivacy;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
  sharedPost?: Post;
  groupId?: string;
  group?: Group;
  createdAt: string;
  updatedAt: string;
}

export type PostPrivacy = 'public' | 'followers' | 'private';

export interface CreatePostData {
  content: string;
  media?: string[];
  feeling?: string;
  location?: string;
  taggedUserIds?: string[];
  privacy: PostPrivacy;
  groupId?: string;
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
  isLiked: boolean;
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
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface SendMessageData {
  content?: string;
  media?: string[];
  replyToId?: string;
  type: MessageType;
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  actor: User;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'like_post'
  | 'comment_post'
  | 'share_post'
  | 'follow'
  | 'follow_back'
  | 'mention'
  | 'tag'
  | 'group_invite'
  | 'group_post'
  | 'message'
  | 'system';

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverPhoto?: string;
  privacy: GroupPrivacy;
  membersCount: number;
  postsCount: number;
  admins: User[];
  moderators: User[];
  isJoined: boolean;
  isPendingApproval: boolean;
  rules?: string[];
  createdAt: string;
  updatedAt: string;
}

export type GroupPrivacy = 'public' | 'private';

export interface GroupMember {
  user: User;
  role: GroupRole;
  joinedAt: string;
}

export type GroupRole = 'admin' | 'moderator' | 'member';

export interface CreateGroupData {
  name: string;
  description?: string;
  privacy: GroupPrivacy;
  rules?: string[];
}

// Search Types
export interface SearchResult {
  users: User[];
  posts: Post[];
  groups: Group[];
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
  GroupDetail: { groupId: string };
  GroupList: undefined;
  CreateGroup: undefined;
  ChatRoom: { conversationId: string };
  Messages: undefined;
  CreatePost: { groupId?: string };
  CreatePostModal: { groupId?: string };
  ImageViewer: { images: Media[]; initialIndex: number };
  Settings: undefined;
  Search: undefined;
  Followers: { userId: string };
  Following: { userId: string };
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
  Search: undefined;
  CreatePost: undefined;
  Notifications: undefined;
  Profile: undefined;
};

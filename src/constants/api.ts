// API Endpoints Configuration for Microservices
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
};

// Gateway URL
export const GATEWAY_URL = `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}`;

// Microservices Endpoints
export const ENDPOINTS = {
  // Auth Service
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_OTP: '/auth/verify-otp',
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },

  // User Service
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    GET_USER: (id: string) => `/users/${id}`,
    SEARCH: '/users/search',
    FOLLOW: (id: string) => `/users/${id}/follow`,
    UNFOLLOW: (id: string) => `/users/${id}/unfollow`,
    FOLLOWERS: (id: string) => `/users/${id}/followers`,
    FOLLOWING: (id: string) => `/users/${id}/following`,
    BLOCK: (id: string) => `/users/${id}/block`,
    UNBLOCK: (id: string) => `/users/${id}/unblock`,
    BLOCKED_USERS: '/users/blocked',
    UPLOAD_AVATAR: '/users/avatar',
    UPLOAD_COVER: '/users/cover',
    ONLINE_STATUS: '/users/online-status',
    SUGGESTIONS: '/users/suggestions',
  },

  // Post Service
  POST: {
    LIST: '/posts',
    CREATE: '/posts',
    GET: (id: string) => `/posts/${id}`,
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    UNLIKE: (id: string) => `/posts/${id}/unlike`,
    COMMENTS: (id: string) => `/posts/${id}/comments`,
    ADD_COMMENT: (id: string) => `/posts/${id}/comments`,
    DELETE_COMMENT: (postId: string, commentId: string) => `/posts/${postId}/comments/${commentId}`,
    SHARE: (id: string) => `/posts/${id}/share`,
    SAVE: (id: string) => `/posts/${id}/save`,
    UNSAVE: (id: string) => `/posts/${id}/unsave`,
    SAVED: '/posts/saved',
    REPORT: (id: string) => `/posts/${id}/report`,
    USER_POSTS: (userId: string) => `/posts/user/${userId}`,
    FEED: '/posts/feed',
    TRENDING: '/posts/trending',
  },

  // Chat Service
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CREATE_CONVERSATION: '/chat/conversations',
    GET_CONVERSATION: (id: string) => `/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    DELETE_MESSAGE: (conversationId: string, messageId: string) =>
      `/chat/conversations/${conversationId}/messages/${messageId}`,
    MARK_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    TYPING: (conversationId: string) => `/chat/conversations/${conversationId}/typing`,
    CREATE_GROUP: '/chat/groups',
    UPDATE_GROUP: (id: string) => `/chat/groups/${id}`,
    ADD_MEMBERS: (id: string) => `/chat/groups/${id}/members`,
    REMOVE_MEMBER: (groupId: string, memberId: string) => `/chat/groups/${groupId}/members/${memberId}`,
    LEAVE_GROUP: (id: string) => `/chat/groups/${id}/leave`,
  },

  // Notification Service
  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
    SETTINGS: '/notifications/settings',
    UPDATE_SETTINGS: '/notifications/settings',
    UNREAD_COUNT: '/notifications/unread-count',
    REGISTER_DEVICE: '/notifications/device',
    UNREGISTER_DEVICE: '/notifications/device',
  },

  // Group Service
  GROUP: {
    LIST: '/groups',
    CREATE: '/groups',
    GET: (id: string) => `/groups/${id}`,
    UPDATE: (id: string) => `/groups/${id}`,
    DELETE: (id: string) => `/groups/${id}`,
    JOIN: (id: string) => `/groups/${id}/join`,
    LEAVE: (id: string) => `/groups/${id}/leave`,
    MEMBERS: (id: string) => `/groups/${id}/members`,
    ADD_MEMBER: (id: string) => `/groups/${id}/members`,
    REMOVE_MEMBER: (groupId: string, memberId: string) => `/groups/${groupId}/members/${memberId}`,
    POSTS: (id: string) => `/groups/${id}/posts`,
    PENDING_POSTS: (id: string) => `/groups/${id}/posts/pending`,
    APPROVE_POST: (groupId: string, postId: string) => `/groups/${groupId}/posts/${postId}/approve`,
    REJECT_POST: (groupId: string, postId: string) => `/groups/${groupId}/posts/${postId}/reject`,
    SEARCH: '/groups/search',
    MY_GROUPS: '/groups/my-groups',
    DISCOVER: '/groups/discover',
  },

  // Media Service
  MEDIA: {
    UPLOAD: '/media/upload',
    UPLOAD_MULTIPLE: '/media/upload-multiple',
    DELETE: (id: string) => `/media/${id}`,
    GET: (id: string) => `/media/${id}`,
  },
};

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Chat
  NEW_MESSAGE: 'chat:new_message',
  MESSAGE_SENT: 'chat:message_sent',
  MESSAGE_READ: 'chat:message_read',
  TYPING_START: 'chat:typing_start',
  TYPING_STOP: 'chat:typing_stop',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Notifications
  NEW_NOTIFICATION: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Posts
  NEW_POST: 'post:new',
  POST_LIKED: 'post:liked',
  POST_COMMENTED: 'post:commented',

  // Follow
  FOLLOW: 'follow:new',
  FOLLOW_BACK: 'follow:back',
};

export default ENDPOINTS;

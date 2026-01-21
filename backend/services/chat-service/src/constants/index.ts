// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  AUTHENTICATION_ERROR: 'Authentication error',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  PARTICIPANTS_REQUIRED: 'Participants required',
  MESSAGE_CONTENT_REQUIRED: 'Message content or media required',
  FAILED_TO_GET_CONVERSATIONS: 'Failed to get conversations',
  FAILED_TO_CREATE_CONVERSATION: 'Failed to create conversation',
  FAILED_TO_GET_CONVERSATION: 'Failed to get conversation',
  FAILED_TO_GET_MESSAGES: 'Failed to get messages',
  FAILED_TO_SEND_MESSAGE: 'Failed to send message',
  FAILED_TO_DELETE_MESSAGE: 'Failed to delete message',
  FAILED_TO_MARK_AS_READ: 'Failed to mark as read',
  FAILED_TO_SEND_TYPING_INDICATOR: 'Failed to send typing indicator',
  FAILED_TO_ADD_MEMBERS: 'Failed to add members',
  FAILED_TO_REMOVE_MEMBER: 'Failed to remove member',
  FAILED_TO_LEAVE_GROUP: 'Failed to leave group',
  GROUP_NOT_FOUND_OR_NOT_ADMIN: 'Group not found or not admin',
};

// Success messages
export const SUCCESS_MESSAGES = {
  MESSAGE_DELETED: 'Message deleted',
  MARKED_AS_READ: 'Marked as read',
  MEMBERS_ADDED: 'Members added',
  MEMBER_REMOVED: 'Member removed',
  LEFT_GROUP: 'Left group',
  OK: 'OK',
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  MARK_READ: 'mark_read',
  MESSAGES_READ: 'messages_read',
  SET_ONLINE_STATUS: 'set_online_status',
  USER_STATUS: 'user_status',
  ERROR: 'error',
};

// Default pagination values
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_CONVERSATIONS_LIMIT: 20,
  DEFAULT_MESSAGES_LIMIT: 50,
};

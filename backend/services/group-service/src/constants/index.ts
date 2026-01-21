export const ERROR_MESSAGES = {
  // Auth errors
  UNAUTHORIZED: 'Unauthorized',
  NOT_AUTHORIZED: 'Not authorized',

  // Group errors
  GROUP_NOT_FOUND: 'Group not found',
  FAILED_TO_GET_GROUPS: 'Failed to get groups',
  FAILED_TO_CREATE_GROUP: 'Failed to create group',
  FAILED_TO_UPDATE_GROUP: 'Failed to update group',
  FAILED_TO_DELETE_GROUP: 'Failed to delete group',
  ONLY_OWNER_CAN_DELETE: 'Only owner can delete group',

  // Member errors
  ALREADY_MEMBER: 'Already a member',
  NOT_MEMBER: 'Not a member',
  OWNER_CANNOT_LEAVE: 'Owner cannot leave. Transfer ownership or delete group.',
  FAILED_TO_GET_MEMBERS: 'Failed to get members',
  MEMBER_NOT_FOUND: 'Member not found',
  CANNOT_REMOVE_OWNER: 'Cannot remove owner',
  ONLY_OWNER_CAN_REMOVE_ADMINS: 'Only owner can remove admins',
  FAILED_TO_REMOVE_MEMBER: 'Failed to remove member',
  ONLY_OWNER_CAN_CHANGE_ROLES: 'Only owner can change roles',
  FAILED_TO_UPDATE_ROLE: 'Failed to update role',

  // Join request errors
  JOIN_REQUEST_ALREADY_PENDING: 'Join request already pending',
  FAILED_TO_JOIN_GROUP: 'Failed to join group',
  FAILED_TO_LEAVE_GROUP: 'Failed to leave group',
  FAILED_TO_GET_JOIN_REQUESTS: 'Failed to get join requests',
  REQUEST_NOT_FOUND: 'Request not found',
  FAILED_TO_HANDLE_REQUEST: 'Failed to handle request',

  // Post errors
  POST_NOT_FOUND: 'Post not found',
  MUST_BE_MEMBER_TO_POST: 'Must be a member to post',
  MEMBERS_CANNOT_POST: 'Members cannot post in this group',
  NOT_AUTHORIZED_TO_VIEW_POSTS: 'Not authorized to view posts',
  FAILED_TO_GET_POSTS: 'Failed to get posts',
  FAILED_TO_CREATE_POST: 'Failed to create post',
  FAILED_TO_DELETE_POST: 'Failed to delete post',

  // Like errors
  ALREADY_LIKED: 'Already liked',
  NOT_LIKED: 'Not liked',
  FAILED_TO_LIKE_POST: 'Failed to like post',
  FAILED_TO_UNLIKE_POST: 'Failed to unlike post',

  // Pin errors
  FAILED_TO_PIN_UNPIN_POST: 'Failed to pin/unpin post',

  // Comment errors
  CONTENT_REQUIRED: 'Content required',
  FAILED_TO_GET_COMMENTS: 'Failed to get comments',
  FAILED_TO_ADD_COMMENT: 'Failed to add comment',
} as const;

export const SUCCESS_MESSAGES = {
  GROUP_DELETED: 'Group deleted',
  JOIN_REQUEST_SENT: 'Join request sent',
  JOINED_GROUP: 'Joined group',
  LEFT_GROUP: 'Left group',
  MEMBER_REMOVED: 'Member removed',
  ROLE_UPDATED: 'Role updated',
  REQUEST_APPROVED: 'Request approved',
  REQUEST_REJECTED: 'Request rejected',
  POST_DELETED: 'Post deleted',
  POST_LIKED: 'Post liked',
  POST_UNLIKED: 'Post unliked',
  POST_PINNED: 'Post pinned',
  POST_UNPINNED: 'Post unpinned',
} as const;

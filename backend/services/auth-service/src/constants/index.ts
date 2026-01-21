// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  REFRESH_TOKEN_REQUIRED: 'Refresh token required',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  LOGIN_FAILED: 'Login failed',
  REGISTER_FAILED: 'Registration failed',
  FORGOT_PASSWORD_FAILED: 'Failed to process request',
  GET_USER_FAILED: 'Failed to get user',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_SENT: 'If email exists, reset instructions will be sent',
} as const;

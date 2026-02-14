export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  EMAIL_EXISTS: 'Email đã được sử dụng',
  STUDENT_ID_EXISTS: 'Mã sinh viên đã được sử dụng',
  INVALID_TOKEN: 'Token không hợp lệ',
  TOKEN_EXPIRED: 'Token đã hết hạn',
  UNAUTHORIZED: 'Bạn cần đăng nhập để thực hiện hành động này',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này',

  // Email verification
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực. Vui lòng kiểm tra email',
  EMAIL_ALREADY_VERIFIED: 'Email đã được xác thực trước đó',
  INVALID_VERIFICATION_CODE: 'Mã xác thực không hợp lệ hoặc đã hết hạn',
  VERIFICATION_CODE_EXPIRED: 'Mã xác thực đã hết hạn',

  // Password reset
  RESET_CODE_INVALID: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
  PASSWORD_SAME_AS_OLD: 'Mật khẩu mới không được giống mật khẩu cũ',

  // 2FA
  TWO_FACTOR_REQUIRED: 'Cần mã xác thực 2 bước để đăng nhập',
  TWO_FACTOR_INVALID: 'Mã xác thực 2 bước không hợp lệ',
  TWO_FACTOR_ALREADY_ENABLED: 'Xác thực 2 bước đã được bật',
  TWO_FACTOR_NOT_ENABLED: 'Xác thực 2 bước chưa được bật',

  // Rate limit
  TOO_MANY_ATTEMPTS: 'Quá nhiều lần thử, vui lòng thử lại sau',

  // User
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  CANNOT_FOLLOW_SELF: 'Không thể follow chính mình',
  ALREADY_FOLLOWING: 'Đã follow người dùng này',
  NOT_FOLLOWING: 'Chưa follow người dùng này',

  // Post
  POST_NOT_FOUND: 'Không tìm thấy bài viết',
  COMMENT_NOT_FOUND: 'Không tìm thấy bình luận',
  ALREADY_LIKED: 'Đã like bài viết này',
  NOT_LIKED: 'Chưa like bài viết này',



  // Media
  FILE_NOT_FOUND: 'Không tìm thấy file',
  FILE_TOO_LARGE: 'File quá lớn',
  FILE_TYPE_NOT_ALLOWED: 'Loại file không được hỗ trợ',

  // General
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  INTERNAL_ERROR: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
  NOT_FOUND: 'Không tìm thấy tài nguyên',
} as const;

export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',

  // Email verification
  VERIFICATION_EMAIL_SENT: 'Đã gửi mã xác thực đến email của bạn',
  EMAIL_VERIFIED: 'Xác thực email thành công',

  // Password reset
  RESET_EMAIL_SENT: 'Đã gửi mã đặt lại mật khẩu đến email của bạn',
  PASSWORD_RESET_SUCCESS: 'Đặt lại mật khẩu thành công',
  RESET_CODE_VERIFIED: 'Mã xác thực hợp lệ',

  // 2FA
  TWO_FACTOR_SETUP: 'Quét mã QR bằng ứng dụng xác thực để thiết lập',
  TWO_FACTOR_ENABLED: 'Xác thực 2 bước đã được bật thành công',
  TWO_FACTOR_DISABLED: 'Xác thực 2 bước đã được tắt',

  // User
  PROFILE_UPDATED: 'Cập nhật thông tin thành công',
  FOLLOW_SUCCESS: 'Follow thành công',
  UNFOLLOW_SUCCESS: 'Unfollow thành công',

  // Post
  POST_CREATED: 'Tạo bài viết thành công',
  POST_UPDATED: 'Cập nhật bài viết thành công',
  POST_DELETED: 'Xóa bài viết thành công',
  COMMENT_CREATED: 'Bình luận thành công',
  COMMENT_DELETED: 'Xóa bình luận thành công',



  // Media
  UPLOAD_SUCCESS: 'Tải file thành công',
  DELETE_SUCCESS: 'Xóa file thành công',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

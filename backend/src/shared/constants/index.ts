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

  // Group
  GROUP_NOT_FOUND: 'Không tìm thấy nhóm',
  ALREADY_MEMBER: 'Đã là thành viên nhóm',
  NOT_MEMBER: 'Không phải thành viên nhóm',
  CANNOT_REMOVE_OWNER: 'Không thể xóa chủ nhóm',

  // Media
  FILE_NOT_FOUND: 'Không tìm thấy file',
  FILE_TOO_LARGE: 'File quá lớn',
  FILE_TYPE_NOT_ALLOWED: 'Loại file không được hỗ trợ',

  // Dating
  DATING_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ hẹn hò',
  DATING_PROFILE_EXISTS: 'Bạn đã có hồ sơ hẹn hò',
  AGE_TOO_YOUNG: 'Bạn phải từ 18 tuổi trở lên',
  BIO_TOO_SHORT: 'Mô tả phải có ít nhất 10 ký tự',
  MAX_PHOTOS_EXCEEDED: 'Tối đa 6 ảnh',
  MIN_PHOTOS_REQUIRED: 'Cần ít nhất 1 ảnh',
  MAX_PROMPTS_EXCEEDED: 'Tối đa 3 câu hỏi',
  PHOTO_NOT_FOUND: 'Không tìm thấy ảnh',
  DUPLICATE_PHOTO_ORDER: 'Thứ tự ảnh đã được sử dụng',
  INVALID_AGE_RANGE: 'Độ tuổi tối thiểu phải nhỏ hơn hoặc bằng độ tuổi tối đa',
  CANNOT_SWIPE_SELF: 'Không thể swipe chính mình',
  ALREADY_SWIPED: 'Bạn đã swipe người này rồi',
  MATCH_NOT_FOUND: 'Không tìm thấy kết nối',
  BLOCKED_USER: 'Không thể tương tác với người dùng này',

  // General
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  INTERNAL_ERROR: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
  NOT_FOUND: 'Không tìm thấy tài nguyên',
} as const;

export const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',

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

  // Group
  GROUP_CREATED: 'Tạo nhóm thành công',
  GROUP_UPDATED: 'Cập nhật nhóm thành công',
  GROUP_DELETED: 'Xóa nhóm thành công',
  JOIN_REQUEST_SENT: 'Đã gửi yêu cầu tham gia',
  MEMBER_APPROVED: 'Đã duyệt thành viên',
  MEMBER_REMOVED: 'Đã xóa thành viên',

  // Media
  UPLOAD_SUCCESS: 'Tải file thành công',
  DELETE_SUCCESS: 'Xóa file thành công',

  // Dating
  DATING_PROFILE_CREATED: 'Tạo hồ sơ hẹn hò thành công',
  DATING_PROFILE_UPDATED: 'Cập nhật hồ sơ hẹn hò thành công',
  PHOTO_ADDED: 'Thêm ảnh thành công',
  PHOTO_DELETED: 'Xóa ảnh thành công',
  PROMPTS_UPDATED: 'Cập nhật câu hỏi thành công',
  LIFESTYLE_UPDATED: 'Cập nhật lối sống thành công',
  PREFERENCES_UPDATED: 'Cập nhật sở thích thành công',
  SWIPE_SUCCESS: 'Swipe thành công',
  MATCH_CREATED: 'Bạn có một kết nối mới!',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

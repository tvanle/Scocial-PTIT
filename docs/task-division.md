# Phân Chia Công Việc - PTIT Social

> **Lưu ý:** Chỉ bao gồm phần Social, không bao gồm module Dating.

## Tổng Quan

| Vai trò | Phạm vi | Số API Endpoints |
|---------|---------|------------------|
| **Người 1** | Auth + User + Media | ~25 endpoints |
| **Người 2** | Post + Chat + Notification | ~30 endpoints |
| **Presenter** | Slides + Demo + Q&A | - |

---

## Người 1: Authentication & User Management

### Backend

#### Module Auth (`/api/v1/auth`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập |
| POST | `/logout` | Đăng xuất |
| POST | `/logout-all` | Đăng xuất tất cả thiết bị |
| POST | `/refresh-token` | Làm mới access token |
| POST | `/verify-email` | Xác thực email bằng OTP (6 số, hết hạn 15 phút) |
| POST | `/resend-verification` | Gửi lại mã xác thực |
| POST | `/forgot-password` | Yêu cầu reset mật khẩu |
| POST | `/reset-password` | Đặt lại mật khẩu bằng OTP |
| POST | `/change-password` | Đổi mật khẩu (cần đăng nhập) |
| GET | `/me` | Lấy thông tin user hiện tại |
| POST | `/2fa/setup` | Thiết lập xác thực 2 bước (TOTP) |
| POST | `/2fa/enable` | Bật 2FA |
| POST | `/2fa/disable` | Tắt 2FA |

#### Module User (`/api/v1/users`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/:userId` | Xem profile người dùng |
| PATCH | `/profile` | Cập nhật thông tin cá nhân |
| POST | `/avatar` | Upload ảnh đại diện |
| POST | `/cover` | Upload ảnh bìa |
| GET | `/search` | Tìm kiếm người dùng |
| POST | `/:userId/follow` | Theo dõi người dùng |
| DELETE | `/:userId/follow` | Bỏ theo dõi |
| GET | `/:userId/followers` | Danh sách người theo dõi |
| GET | `/:userId/following` | Danh sách đang theo dõi |

#### Module Media (`/api/v1/media`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | `/upload` | Upload 1 file |
| POST | `/upload-multiple` | Upload nhiều file |
| DELETE | `/:mediaId` | Xóa media |
| GET | `/:mediaId` | Lấy thông tin media |

### Frontend (Mobile)

| Screen | Chức năng |
|--------|-----------|
| `LoginScreen` | Màn hình đăng nhập |
| `RegisterScreen` | Màn hình đăng ký |
| `ForgotPasswordScreen` | Quên mật khẩu |
| `VerifyEmailScreen` | Xác thực email OTP |
| `ProfileScreen` | Trang cá nhân (bản thân) |
| `UserProfileScreen` | Trang cá nhân (người khác) |
| `EditProfileScreen` | Chỉnh sửa hồ sơ |
| `FollowersScreen` | Danh sách followers/following |
| `SearchScreen` | Tìm kiếm người dùng |

### Tóm tắt trách nhiệm

- Toàn bộ luồng đăng ký, đăng nhập, đăng xuất
- Bảo mật: JWT tokens, 2FA (TOTP - Google Authenticator), email OTP
- Quản lý hồ sơ người dùng, upload ảnh
- Hệ thống follow/unfollow
- Tìm kiếm người dùng
- Upload và quản lý media files

---

## Người 2: Posts & Real-time Communication

### Backend

#### Module Post (`/api/v1/posts`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/feed` | Lấy bảng tin (feed) |
| GET | `/user/:userId` | Lấy bài viết của user |
| GET | `/user/:userId/shares` | Lấy bài viết đã share |
| GET | `/user/:userId/replies` | Lấy bình luận của user |
| POST | `/` | Tạo bài viết mới |
| GET | `/:postId` | Xem chi tiết bài viết |
| PATCH | `/:postId` | Chỉnh sửa bài viết |
| DELETE | `/:postId` | Xóa bài viết |
| POST | `/:postId/like` | Thích bài viết |
| DELETE | `/:postId/like` | Bỏ thích |
| POST | `/:postId/vote` | Bình chọn poll |
| DELETE | `/:postId/vote` | Hủy bình chọn |
| POST | `/:postId/share` | Chia sẻ bài viết (repost) |
| DELETE | `/:postId/share` | Hủy chia sẻ |
| GET | `/:postId/comments` | Lấy danh sách bình luận |
| POST | `/:postId/comments` | Tạo bình luận |
| DELETE | `/comments/:commentId` | Xóa bình luận |
| GET | `/comments/:commentId/replies` | Lấy replies của comment |
| POST | `/comments/:commentId/like` | Thích bình luận |
| DELETE | `/comments/:commentId/like` | Bỏ thích bình luận |
| POST | `/comments/:commentId/share` | Chia sẻ bình luận |
| DELETE | `/comments/:commentId/share` | Hủy chia sẻ bình luận |
| GET | `/user/:userId/comment-shares` | Lấy comment đã share |

#### Module Chat (`/api/v1/chat`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | `/conversations` | Tạo cuộc trò chuyện |
| GET | `/conversations` | Danh sách cuộc trò chuyện |
| GET | `/conversations/:id` | Chi tiết cuộc trò chuyện |
| POST | `/conversations/:id/messages` | Gửi tin nhắn |
| GET | `/conversations/:id/messages` | Lấy tin nhắn (phân trang) |
| DELETE | `/messages/:id` | Xóa tin nhắn |
| POST | `/conversations/:id/read` | Đánh dấu đã đọc |
| GET | `/unread-count` | Số tin nhắn chưa đọc |
| GET | `/users/:userId/status` | Trạng thái online |

**Socket.io Events (Real-time):**

| Event | Hướng | Chức năng |
|-------|-------|-----------|
| `join` | Client -> Server | User tham gia room |
| `sendMessage` | Client -> Server | Gửi tin nhắn real-time |
| `newMessage` | Server -> Client | Nhận tin nhắn mới |
| `typing` | Client -> Server | Gửi trạng thái đang gõ |
| `userTyping` | Server -> Client | Nhận trạng thái đang gõ |

#### Module Notification (`/api/v1/notifications`)

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/` | Lấy danh sách thông báo |
| GET | `/unread-count` | Số thông báo chưa đọc |
| PATCH | `/:id/read` | Đánh dấu đã đọc |
| POST | `/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/:id` | Xóa thông báo |
| DELETE | `/clear-all` | Xóa tất cả thông báo |
| POST | `/device-token` | Đăng ký device token (push) |

### Frontend (Mobile)

| Screen | Chức năng |
|--------|-----------|
| `HomeScreen` | Bảng tin (feed), hiển thị bài viết |
| `CreatePostScreen` | Tạo bài viết, đính kèm media/poll |
| `PostDetailScreen` | Chi tiết bài viết, bình luận |
| `ChatListScreen` | Danh sách cuộc trò chuyện |
| `ChatRoomScreen` | Phòng chat, gửi/nhận tin nhắn |
| `NotificationScreen` | Danh sách thông báo |

### Tóm tắt trách nhiệm

- Toàn bộ luồng bài viết: tạo, sửa, xóa, feed
- Tương tác: like, comment, reply, share, poll
- Chat real-time qua Socket.io
- Quản lý tin nhắn, trạng thái đọc, online status
- Hệ thống thông báo và push notification

---

## Presenter: Thuyết Trình & Demo

### Nhiệm vụ chính

#### 1. Chuẩn bị Slide trình bày

- Giới thiệu dự án PTIT Social
- Mục tiêu và phạm vi
- Công nghệ sử dụng
- Kiến trúc hệ thống
- Demo các tính năng chính
- Kết luận và hướng phát triển

#### 2. Sơ đồ cần chuẩn bị

| Loại sơ đồ | Nội dung |
|-------------|----------|
| **ERD** | Quan hệ giữa các bảng (User, Post, Comment, Like, Message, ...) |
| **System Architecture** | Monorepo, Express, PostgreSQL, Redis, Socket.io, MinIO |
| **API Flow** | Luồng request từ Mobile -> Backend -> Database |
| **Auth Flow** | Register -> Verify Email -> Login -> JWT -> 2FA |
| **Real-time Flow** | Socket.io connection, message broadcasting |

#### 3. Kiến trúc hệ thống cần nắm

| Thành phần | Chi tiết |
|------------|----------|
| **Frontend** | React Native, Expo 54, TypeScript |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (single DB, port 5434) |
| **Cache** | Redis |
| **Real-time** | Socket.io (cùng port 3001 với HTTP) |
| **Storage** | MinIO / AWS S3 (configurable) |
| **Auth** | JWT (Access + Refresh Token), 2FA (TOTP) |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Container** | Docker Compose |

#### 4. Demo live / Video

- Luồng đăng ký, xác thực email, đăng nhập
- Tạo bài viết, like, comment, share
- Chat real-time giữa 2 user
- Thông báo push notification
- Tìm kiếm và follow user
- Chỉnh sửa profile

#### 5. Chuẩn bị trả lời Q&A

Một số câu hỏi có thể gặp:
- Tại sao chọn monorepo thay vì microservices?
- Cơ chế refresh token hoạt động như thế nào?
- Socket.io xử lý khi user offline ra sao?
- Prisma ORM có ưu/nhược điểm gì so với raw SQL?
- Hệ thống notification hoạt động như thế nào?
- Bảo mật API được xử lý ra sao (rate limiting, JWT, 2FA)?

---

## Ghi Chú Phối Hợp

- **Database schema** (`backend/prisma/schema.prisma`) là file chung, cần phối hợp khi thay đổi
- **Middleware** (`backend/src/middleware/`) dùng chung cho cả 2 người
- **Theme & Design** (`src/constants/theme.ts`) thống nhất PTIT Red (`#B3261E`)
- Presenter cần phối hợp với cả 2 để hiểu rõ tính năng trước khi thuyết trình

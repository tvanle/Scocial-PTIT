# Phân Chia Công Việc - PTIT Social

> **Lưu ý:** Chỉ bao gồm phần Social, không bao gồm module Dating.

## Tổng Quan

| Vai trò | Phạm vi | Số API Endpoints |
|---------|---------|------------------|
| **Người 1** | Auth + User + Media | ~27 endpoints |
| **Người 2** | Post + Chat + Notification | ~31 endpoints + 5 Socket events |
| **Presenter** | Slides + Demo + Q&A | - |

### Tech Stack chung

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | React Native, Expo 54, TypeScript |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (single DB, port 5434) |
| **Cache** | Redis |
| **Real-time** | Socket.io (cùng port 3001 với HTTP) |
| **Storage** | MinIO / AWS S3 (configurable) |
| **Auth** | JWT (Access + Refresh Token), 2FA (TOTP) |
| **Push** | Firebase Cloud Messaging (FCM) |
| **Container** | Docker Compose |
| **Validation** | Zod (Vietnamese error messages) |

### Cấu trúc Response chung

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Thành công"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "statusCode": 400
}
```

**Paginated Response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Middleware chung

| Middleware | Chức năng |
|-----------|-----------|
| `authenticate` | Bắt buộc JWT Bearer token, gắn `req.user = { userId, email }`. Trả 401 nếu thiếu/hết hạn |
| `optionalAuth` | Tương tự `authenticate` nhưng không bắt buộc, cho phép anonymous access |
| `validateBody(schema)` | Validate request body bằng Zod schema, trả 400 nếu lỗi |

---

# NGƯỜI 1: Authentication & User Management

## A. Module Auth (`/api/v1/auth`)

**File locations:**
- Routes: `backend/src/modules/auth/auth.routes.ts`
- Controller: `backend/src/modules/auth/auth.controller.ts`
- Service: `backend/src/modules/auth/auth.service.ts`
- Validator: `backend/src/modules/auth/auth.validator.ts`

**Dependencies:** bcryptjs (salt: 12), jsonwebtoken, otplib (TOTP), qrcode, crypto, zod

---

### A1. Đăng ký - POST `/register`

**Middleware:** `validateBody(registerSchema)`

**Request Body:**
```typescript
{
  email: string,        // required, email format
  password: string,     // required, min 6 ký tự
  fullName?: string,    // optional, min 2 ký tự
  studentId?: string    // optional
}
```

**Response (201 CREATED):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "studentId": "B21DCCN001",
      "avatar": null,
      "isEmailVerified": false,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản"
}
```

**Logic chi tiết:**
1. Kiểm tra email đã tồn tại -> throw `EMAIL_EXISTS` (409)
2. Kiểm tra studentId đã tồn tại (nếu có) -> throw `STUDENT_ID_EXISTS` (409)
3. Hash password bằng bcrypt (salt rounds: 12)
4. Tạo user mới trong database
5. Generate accessToken + refreshToken (JWT)
6. Lưu refreshToken vào DB (hết hạn 30 ngày)
7. Tạo mã OTP 6 số (EMAIL_VERIFY, hết hạn 15 phút)
8. Gửi email xác thực qua SMTP (Nodemailer)
9. Trả về user + tokens

**Error cases:**
| Status | Message |
|--------|---------|
| 409 | "Email đã được sử dụng" |
| 409 | "Mã sinh viên đã được sử dụng" |
| 400 | Validation errors (Zod) |

---

### A2. Đăng nhập - POST `/login`

**Middleware:** `validateBody(loginSchema)`

**Request Body:**
```typescript
{
  email: string,           // required, email format
  password: string,        // required, min 1 ký tự
  twoFactorCode?: string   // optional, 6 chữ số (nếu bật 2FA)
}
```

**Response (200 OK) - Đăng nhập thành công:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "avatar": "https://minio.example.com/avatars/...",
      "isVerified": true,
      "twoFactorEnabled": false
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "Đăng nhập thành công"
}
```

**Response - Cần 2FA:**
```json
{
  "success": true,
  "data": {
    "requiresTwoFactor": true,
    "message": "Cần mã xác thực 2 bước để đăng nhập"
  }
}
```

**Logic chi tiết:**
1. Tìm user theo email -> không tìm thấy: throw 401
2. Kiểm tra `user.isVerified` -> false: throw 403 "Vui lòng xác thực email trước khi đăng nhập"
3. So sánh password bằng bcrypt -> sai: throw 401
4. Nếu 2FA đã bật:
   - Không có `twoFactorCode` -> trả `{ requiresTwoFactor: true }`
   - Có code -> verify bằng `otplib.verifySync()` -> sai: throw 401
5. Cập nhật `lastActiveAt`
6. Generate tokens, lưu refreshToken
7. Trả user (không có password/twoFactorSecret) + tokens

**Error cases:**
| Status | Message |
|--------|---------|
| 401 | "Email hoặc mật khẩu không đúng" |
| 403 | "Vui lòng xác thực email trước khi đăng nhập" |
| 401 | "Mã xác thực 2 bước không hợp lệ" |

---

### A3. Đăng xuất - POST `/logout`

**Middleware:** Không

**Request Body:**
```typescript
{
  refreshToken: string  // token cần invalidate
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Đăng xuất thành công"
}
```

**Logic:** Xóa refreshToken khỏi database.

---

### A4. Đăng xuất tất cả thiết bị - POST `/logout-all`

**Middleware:** `authenticate`

**Request Body:** Không cần

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Đăng xuất thành công"
}
```

**Logic:** Xóa TẤT CẢ refreshTokens của user khỏi database -> tất cả thiết bị bị đăng xuất.

---

### A5. Làm mới Token - POST `/refresh-token`

**Middleware:** `validateBody(refreshTokenSchema)`

**Request Body:**
```typescript
{
  refreshToken: string  // required
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...(mới)",
    "refreshToken": "eyJhbG...(mới)"
  }
}
```

**Logic chi tiết:**
1. Verify refreshToken signature bằng `jwt.verify(token, refreshSecret)`
2. Kiểm tra token tồn tại trong DB và chưa hết hạn
3. Xóa refreshToken cũ khỏi DB
4. Generate cặp token mới
5. Lưu refreshToken mới (hết hạn 30 ngày)

**Error cases:**
| Status | Message |
|--------|---------|
| 401 | "Token không hợp lệ" |
| 401 | "Token đã hết hạn" |

---

### A6. Lấy thông tin User hiện tại - GET `/me`

**Middleware:** `authenticate`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "studentId": "B21DCCN001",
    "avatar": "https://...",
    "coverImage": "https://...",
    "bio": "Hello world",
    "dateOfBirth": "2003-01-15T00:00:00.000Z",
    "gender": "MALE",
    "phone": "0123456789",
    "isVerified": true,
    "isEmailVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "postsCount": 15,
    "followersCount": 120,
    "followingCount": 85
  }
}
```

---

### A7. Đổi mật khẩu - POST `/change-password`

**Middleware:** `authenticate`, `validateBody(changePasswordSchema)`

**Request Body:**
```typescript
{
  currentPassword: string,  // required
  newPassword: string       // required, min 6 ký tự
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Đổi mật khẩu thành công"
}
```

**Logic:**
1. Verify mật khẩu hiện tại bằng bcrypt
2. Hash mật khẩu mới
3. Cập nhật password
4. Gọi `logoutAll()` -> buộc đăng nhập lại trên tất cả thiết bị

---

### A8. Quên mật khẩu - POST `/forgot-password`

**Middleware:** `validateBody(forgotPasswordSchema)`

**Request Body:**
```typescript
{
  email: string  // required, email format
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Đã gửi mã đặt lại mật khẩu đến email của bạn"
}
```

**Logic:**
1. Tìm user theo email
2. Không tìm thấy -> **trả về thành công** (không tiết lộ email có tồn tại hay không - bảo mật)
3. Tạo mã OTP (PASSWORD_RESET, hết hạn 15 phút)
4. Gửi email reset (non-blocking)

---

### A9. Xác thực mã Reset - POST `/verify-reset-code`

**Middleware:** `validateBody(verifyResetCodeSchema)`

**Request Body:**
```typescript
{
  email: string,  // required
  code: string    // required, 6 chữ số
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { "valid": true },
  "message": "Mã xác thực hợp lệ"
}
```

**Logic:** Kiểm tra mã OTP hợp lệ nhưng CHƯA đánh dấu đã dùng (bước kiểm tra trước khi reset).

---

### A10. Đặt lại mật khẩu - POST `/reset-password`

**Middleware:** `validateBody(resetPasswordSchema)`

**Request Body:**
```typescript
{
  email: string,       // required
  code: string,        // required, 6 chữ số
  newPassword: string  // required, min 6 ký tự
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Đặt lại mật khẩu thành công"
}
```

**Logic:**
1. Verify và consume OTP code
2. Kiểm tra mật khẩu mới != mật khẩu cũ -> throw 400 "Mật khẩu mới không được giống mật khẩu cũ"
3. Hash và cập nhật password
4. `logoutAll()` -> buộc đăng nhập lại

---

### A11. Xác thực Email (Protected) - POST `/verify-email`

**Middleware:** `authenticate`, `validateBody(verifyEmailSchema)`

**Request Body:**
```typescript
{
  code: string  // required, 6 chữ số
}
```

**Logic:** Verify OTP -> cập nhật `isEmailVerified = true` VÀ `isVerified = true`.

---

### A12. Xác thực Email (Public) - POST `/verify-email-public`

**Middleware:** `validateBody(verifyEmailPublicSchema)`

**Request Body:**
```typescript
{
  email: string,  // required
  code: string    // required, 6 chữ số
}
```

**Logic:** Tương tự A11 nhưng tìm user theo email thay vì JWT token.

---

### A13. Gửi lại mã xác thực (Protected) - POST `/send-verification`

**Middleware:** `authenticate`

**Logic:** Tạo OTP mới (EMAIL_VERIFY) và gửi email. Throw 400 nếu đã verified.

---

### A14. Gửi lại mã xác thực (Public) - POST `/resend-verification`

**Middleware:** `validateBody(resendVerificationSchema)`

**Request Body:**
```typescript
{
  email: string  // required
}
```

**Logic:** Tìm user theo email, tạo OTP mới. Không tìm thấy -> trả thành công (bảo mật).

---

### A15. Thiết lập 2FA - POST `/2fa/setup`

**Middleware:** `authenticate`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "otpauthUrl": "otpauth://totp/PTIT%20Social:user@email.com?secret=..."
  },
  "message": "Quét mã QR bằng ứng dụng xác thực để thiết lập"
}
```

**Logic:**
1. Kiểm tra 2FA chưa bật -> đã bật: throw 400
2. Generate TOTP secret bằng `otplib.generateSecret()`
3. Lưu secret vào user (chưa enable)
4. Generate QR code URI -> convert sang data URL
5. Trả secret + QR code + otpauth URL

---

### A16. Bật 2FA - POST `/2fa/enable`

**Middleware:** `authenticate`, `validateBody(verify2FASchema)`

**Request Body:**
```typescript
{
  code: string  // required, 6 chữ số từ Google Authenticator
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backupCodes": [
      "a1b2c3d4", "e5f6g7h8", "i9j0k1l2", "m3n4o5p6",
      "q7r8s9t0", "u1v2w3x4", "y5z6a7b8", "c9d0e1f2"
    ]
  },
  "message": "Xác thực 2 bước đã được bật thành công"
}
```

**Logic:**
1. Kiểm tra secret đã setup -> chưa: throw 400
2. Verify TOTP code bằng `otplib.verifySync(code, secret)`
3. Set `twoFactorEnabled = true`
4. Generate 8 backup codes bằng `crypto.randomBytes(4).toString('hex')`
5. Gửi email xác nhận (non-blocking)

---

### A17. Tắt 2FA - POST `/2fa/disable`

**Middleware:** `authenticate`, `validateBody(disable2FASchema)`

**Request Body:**
```typescript
{
  code: string,     // required, 6 chữ số
  password: string  // required, xác nhận mật khẩu
}
```

**Logic:**
1. Verify password bằng bcrypt
2. Verify TOTP code
3. Set `twoFactorEnabled = false`, `twoFactorSecret = null`

---

## B. Module User (`/api/v1/users`)

**File locations:**
- Routes: `backend/src/modules/user/user.routes.ts`
- Controller: `backend/src/modules/user/user.controller.ts`
- Service: `backend/src/modules/user/user.service.ts`
- Validator: `backend/src/modules/user/user.validator.ts`

---

### B1. Tìm kiếm người dùng - GET `/search`

**Middleware:** Không (Public)

**Query Parameters:**
```typescript
{
  q: string,      // required, min 1 ký tự - từ khóa tìm kiếm
  page?: string,  // optional, default: 1
  limit?: string  // optional, default: 20, max: 100
}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Nguyễn Văn A",
      "avatar": "https://...",
      "studentId": "B21DCCN001",
      "isVerified": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Logic:** Tìm kiếm case-insensitive trên `fullName`, `email`, `studentId`. Sắp xếp theo `fullName` tăng dần.

---

### B2. Xem Profile người dùng - GET `/:userId`

**Middleware:** `optionalAuth`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "studentId": "B21DCCN001",
    "avatar": "https://...",
    "coverImage": "https://...",
    "bio": "PTIT Student",
    "favoriteMusic": "Đừng Làm Trái Tim Anh Đau",
    "dateOfBirth": "2003-01-15T00:00:00.000Z",
    "gender": "MALE",
    "isVerified": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "isFollowing": true,
    "postsCount": 15,
    "followersCount": 120,
    "followingCount": 85
  }
}
```

**Logic:** Nếu đã đăng nhập -> thêm `isFollowing` (boolean). Nếu chưa đăng nhập -> `isFollowing = null`.

---

### B3. Cập nhật Profile - PATCH `/profile`

**Middleware:** `authenticate`, `validateBody(updateProfileSchema)`

**Request Body:**
```typescript
{
  fullName?: string,       // min 2 ký tự
  bio?: string,            // max 500 ký tự
  favoriteMusic?: string,  // nullable, max 100 ký tự
  dateOfBirth?: string,    // ISO DateTime
  gender?: 'MALE' | 'FEMALE' | 'OTHER',
  phone?: string,
  faculty?: string,
  className?: string
}
```

**Response (200 OK):** Updated user object (id, email, fullName, studentId, avatar, coverImage, bio, favoriteMusic, dateOfBirth, gender, phone, isVerified, createdAt)

**Logic:** Partial update - chỉ cập nhật các field được gửi. `dateOfBirth` tự động convert sang Date object.

---

### B4. Upload Avatar - POST `/avatar`

**Middleware:** `authenticate`, `uploadMemory.single('avatar')`

**Request:** Multipart form-data, field name: `avatar`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "avatar": "https://minio.example.com/avatars/avatar-uuid.jpg"
  }
}
```

**Logic:**
1. Nhận file qua multipart
2. Resize bằng Sharp: **512x512px**, cover fit, JPEG quality 85%
3. Xóa avatar cũ khỏi MinIO (nếu có)
4. Upload lên MinIO bucket `avatars` với filename: `avatar-{uuid}.jpg`
5. Cập nhật URL trong database

---

### B5. Upload Cover Image - POST `/cover`

**Middleware:** `authenticate`, `uploadMemory.single('cover')`

**Request:** Multipart form-data, field name: `cover`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "coverImage": "https://minio.example.com/avatars/cover-uuid.jpg"
  }
}
```

**Logic:** Tương tự B4 nhưng resize **1920x1080px**, inside fit, không phóng to.

---

### B6. Follow - POST `/:userId/follow`

**Middleware:** `authenticate`

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Follow thành công"
}
```

**Logic:**
1. Kiểm tra không tự follow chính mình -> throw 400
2. Kiểm tra user target tồn tại -> throw 404
3. Kiểm tra chưa follow -> đã follow: throw 409
4. Tạo Follow record
5. Tạo Notification (type: FOLLOW) cho target user

---

### B7. Unfollow - DELETE `/:userId/follow`

**Middleware:** `authenticate`

**Logic:** Xóa Follow record. Throw 400 nếu chưa follow.

---

### B8. Danh sách Followers - GET `/:userId/followers`

**Middleware:** Không (Public)

**Query:** `page`, `limit`

**Response:** Paginated list user objects (id, fullName, avatar, studentId, isVerified, followedAt). Sắp xếp theo `createdAt` DESC.

---

### B9. Danh sách Following - GET `/:userId/following`

**Middleware:** Không (Public)

**Logic:** Tương tự B8 nhưng trả danh sách user đang theo dõi.

---

## C. Module Media (`/api/v1/media`)

**File locations:**
- Routes: `backend/src/modules/media/media.routes.ts`
- Controller: `backend/src/modules/media/media.controller.ts`
- Service: `backend/src/modules/media/media.service.ts`

---

### C1. Upload Single File - POST `/upload`

**Middleware:** `authenticate`, `uploadSingle` (memory storage)

**Request:** Multipart form-data, field name: `file`

**Response (201 CREATED):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://minio.example.com/posts/uuid.jpg",
    "type": "IMAGE",
    "filename": "uuid.jpg",
    "mimeType": "image/jpeg",
    "size": 245760,
    "width": 1920,
    "height": 1080,
    "postId": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Xử lý file:**
| Loại | Xử lý |
|------|--------|
| **Image (non-HEIC)** | Resize 1920x1920 (inside fit), JPEG quality 85%, extract dimensions |
| **Image (HEIC/HEIF)** | Lưu trực tiếp, không xử lý |
| **Video/Audio/Document** | Lưu trực tiếp với extension gốc |

**Storage:** Upload lên MinIO bucket `posts`, filename: `{uuid}.{ext}`

---

### C2. Upload Multiple Files - POST `/upload/multiple`

**Middleware:** `authenticate`, `uploadMultiple`

**Request:** Multipart form-data, field name: `files` (max 10 files)

**Response (201 CREATED):** Array of media objects (tương tự C1)

**Logic:** Upload song song bằng `Promise.all()`. Fail-all nếu bất kỳ file nào lỗi.

---

### C3. Lấy thông tin Media - GET `/:mediaId`

**Middleware:** Không (Public)

**Response:** Media object. Throw 404 nếu không tìm thấy.

---

### C4. Xóa Media - DELETE `/:mediaId`

**Middleware:** `authenticate`

**Logic:**
1. Kiểm tra media tồn tại -> throw 404
2. Kiểm tra quyền sở hữu (phải là tác giả bài viết) -> throw 403
3. Xóa file khỏi MinIO (tolerant - log warning nếu lỗi storage)
4. Xóa record khỏi database

---

## D. Frontend (Mobile) - Người 1

### D1. LoginScreen (`src/screens/auth/LoginScreen.tsx`)

**UI Elements:**
- Input email/password (pill-shaped, borderRadius: 9999, height: 52px)
- Checkbox "Ghi nhớ đăng nhập"
- Link "Quên mật khẩu?"
- Button "Đăng nhập" (PTIT Red, bold)

**API calls:** `POST /auth/login`
**State:** `useAuthStore` (Zustand)
**Navigation:** -> HomeScreen (thành công), ForgotPasswordScreen, RegisterScreen

---

### D2. RegisterScreen (`src/screens/auth/RegisterScreen.tsx`)

**UI Elements:**
- Input: email, password, confirm password, student ID, faculty dropdown
- Checkbox đồng ý điều khoản

**API calls:** `POST /auth/register`
**State:** `useAuthStore`
**Navigation:** -> VerifyEmailScreen (thành công)

---

### D3. ForgotPasswordScreen (`src/screens/auth/ForgotPasswordScreen.tsx`)

**UI Elements:** Multi-step form (email -> OTP -> new password)

**API calls:**
1. `POST /auth/forgot-password`
2. `POST /auth/verify-reset-code`
3. `POST /auth/reset-password`

---

### D4. VerifyEmailScreen (`src/screens/auth/VerifyEmailScreen.tsx`)

**UI Elements:** Input OTP 6 số, button "Gửi lại mã"

**API calls:**
- `POST /auth/verify-email-public`
- `POST /auth/resend-verification`

---

### D5. ProfileScreen (`src/screens/profile/ProfileScreen.tsx`)

**UI Elements:**
- Hero section: Cover photo, avatar, name, bio
- Stats: Posts count, Followers, Following
- Music section: Bài hát yêu thích
- Posts list: Tương tự HomeScreen
- Image layout: single, double, triple grid

**API calls:**
- `GET /auth/me` hoặc `GET /users/profile`
- `GET /posts/user/{userId}`
- `POST /posts/{id}/like`, `DELETE /posts/{id}/like`

**State:** `useAuthStore`, `usePostActions` hook
**Navigation:** -> EditProfileScreen, FollowersScreen

---

### D6. UserProfileScreen (`src/screens/profile/UserProfileScreen.tsx`)

**UI Elements:** Tương tự ProfileScreen + Button Follow/Unfollow, Nhắn tin

**API calls:**
- `GET /users/{id}`
- `POST /users/{id}/follow`, `DELETE /users/{id}/follow`

---

### D7. EditProfileScreen (`src/screens/profile/EditProfileScreen.tsx`)

**UI Elements:**
- Avatar picker, Cover photo picker
- Input: name, bio, faculty, studentId, className
- Music picker modal

**API calls:**
- `PATCH /users/profile`
- `POST /users/avatar`
- `POST /users/cover`

---

### D8. FollowersScreen (`src/screens/profile/FollowersScreen.tsx`)

**UI Elements:** List followers với button Follow back

**API calls:** `GET /users/{id}/followers`, `GET /users/{id}/following`

---

### D9. SearchScreen (`src/screens/search/SearchScreen.tsx`)

**UI Elements:**
- Search bar với clear button (debounce 400ms)
- Search history (lưu trong SecureStore)
- User results: avatar, name, verification badge, studentId, faculty, bio, chat button

**API calls:** `GET /users/search?q=...`
**Storage:** expo-secure-store cho search history

---

### D10. SettingsScreen (`src/screens/settings/SettingsScreen.tsx`)

**UI Elements:**
- Account: Theme toggle, notification preferences
- Privacy: Block list
- Security: Password change, 2FA settings
- About: App version, terms

**API calls:** `POST /auth/change-password`, `POST /auth/2fa/setup`, `POST /auth/logout`

---

## Database Models - Người 1

### User
```
id            String    @id @default(uuid())
email         String    @unique
password      String
studentId     String?   @unique
fullName      String?
avatar        String?
coverImage    String?
bio           String?
favoriteMusic String?
dateOfBirth   DateTime?
gender        Gender?   (MALE | FEMALE | OTHER)
phone         String?
faculty       String?
className     String?
isVerified    Boolean   @default(false)
isEmailVerified Boolean @default(false)
isActive      Boolean   @default(true)
lastActiveAt  DateTime?
twoFactorEnabled Boolean @default(false)
twoFactorSecret  String?
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

### VerificationCode
```
id        String   @id @default(uuid())
code      String
type      VerificationCodeType (EMAIL_VERIFY | PASSWORD_RESET | TWO_FACTOR)
userId    String   -> User
expiresAt DateTime
isUsed    Boolean  @default(false)
createdAt DateTime @default(now())
@@index([userId, type])
@@index([code, type])
```

### RefreshToken
```
id        String   @id @default(uuid())
token     String   @unique
userId    String   -> User
expiresAt DateTime
createdAt DateTime @default(now())
@@index([userId])
@@index([token])
```

### Follow
```
id          String   @id @default(uuid())
followerId  String   -> User
followingId String   -> User
createdAt   DateTime @default(now())
@@unique([followerId, followingId])
```

### Media
```
id        String    @id @default(uuid())
url       String
type      MediaType (IMAGE | VIDEO | AUDIO | DOCUMENT)
filename  String
mimeType  String
size      Int
width     Int?
height    Int?
duration  Int?
postId    String?   -> Post
createdAt DateTime  @default(now())
```

### DeviceToken
```
id        String   @id @default(uuid())
userId    String   -> User
token     String   @unique
platform  String   (ios | android)
isActive  Boolean  @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

### UserBlock
```
id            String   @id @default(uuid())
blockerId     String   -> User
blockedUserId String   -> User
createdAt     DateTime @default(now())
@@unique([blockerId, blockedUserId])
```

---

# NGƯỜI 2: Posts & Real-time Communication

## E. Module Post (`/api/v1/posts`)

**File locations:**
- Routes: `backend/src/modules/post/post.routes.ts`
- Controller: `backend/src/modules/post/post.controller.ts`
- Service: `backend/src/modules/post/post.service.ts`
- Validator: `backend/src/modules/post/post.validator.ts`

---

### E1. Lấy Feed - GET `/feed`

**Middleware:** `authenticate`

**Query:** `page`, `limit`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello PTIT! #newpost",
      "privacy": "PUBLIC",
      "locationName": "PTIT Hà Nội",
      "latitude": 20.9813,
      "longitude": 105.7877,
      "author": {
        "id": "uuid",
        "fullName": "Nguyễn Văn A",
        "avatar": "https://...",
        "studentId": "B21DCCN001",
        "isVerified": true
      },
      "media": [
        {
          "id": "uuid",
          "url": "https://...",
          "type": "IMAGE",
          "width": 1920,
          "height": 1080
        }
      ],
      "poll": {
        "id": "uuid",
        "question": "Môn nào khó nhất?",
        "options": [
          { "id": "uuid", "text": "DSA", "order": 0, "_count": { "votes": 15 } },
          { "id": "uuid", "text": "OS", "order": 1, "_count": { "votes": 8 } }
        ]
      },
      "likesCount": 42,
      "commentsCount": 12,
      "sharesCount": 5,
      "isLiked": true,
      "isShared": false,
      "isFollowing": true,
      "createdAt": "2026-04-20T10:30:00.000Z",
      "updatedAt": "2026-04-20T10:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**Logic:**
1. Lấy tất cả bài viết, sắp xếp `createdAt` DESC
2. Lấy danh sách following của user
3. Kiểm tra `isLiked`, `isShared` cho từng bài
4. Thêm `isFollowing` cho tác giả mỗi bài

---

### E2. Lấy bài viết của User - GET `/user/:userId`

**Middleware:** `optionalAuth`

**Query:** `page`, `limit`

**Logic:** Lấy tất cả bài viết của userId. Nếu đăng nhập -> thêm `isLiked`, `isShared`.

---

### E3. Lấy bài viết đã Share - GET `/user/:userId/shares`

**Middleware:** `optionalAuth`

**Logic:** Lấy tất cả bài user đã repost. `isShared = true` trong response.

---

### E4. Lấy Replies của User - GET `/user/:userId/replies`

**Middleware:** `optionalAuth`

**Response format:**
```json
{
  "data": [
    {
      "comment": {
        "id": "uuid",
        "content": "Comment nội dung",
        "createdAt": "...",
        "author": { "id": "uuid", "fullName": "...", "avatar": "..." }
      },
      "post": { "...full post object..." }
    }
  ]
}
```

---

### E5. Tạo bài viết - POST `/`

**Middleware:** `authenticate`, `validateBody(createPostSchema)`

**Request Body:**
```typescript
{
  content?: string,          // max 5000 ký tự
  privacy?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE',  // default: PUBLIC
  mediaIds?: string[],       // array UUID, liên kết với media đã upload
  locationName?: string,     // max 200 ký tự
  latitude?: number,         // -90 đến 90
  longitude?: number,        // -180 đến 180
  poll?: {
    question?: string,       // max 200 ký tự
    options: [               // 2-4 options
      {
        text: string,        // min 1, max 100 ký tự
        order?: number
      }
    ]
  }
}
```

**Response (201 CREATED):** Post object đầy đủ.

**Logic:**
1. Tạo post với content, privacy, location
2. Connect mediaIds với Media records đã tồn tại
3. Tạo Poll + PollOptions nếu có
4. Trả post transformed (counts flattened)

---

### E6. Xem chi tiết bài viết - GET `/:postId`

**Middleware:** `optionalAuth`

**Logic:** Lấy single post. Throw 404. Nếu đăng nhập -> `isLiked`, `isShared`.

---

### E7. Chỉnh sửa bài viết - PATCH `/:postId`

**Middleware:** `authenticate`, `validateBody(updatePostSchema)`

**Request Body:**
```typescript
{
  content?: string,   // max 5000 ký tự
  privacy?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
}
```

**Logic:**
1. Kiểm tra post tồn tại -> throw 404
2. Kiểm tra quyền sở hữu -> throw 403
3. Partial update

---

### E8. Xóa bài viết - DELETE `/:postId`

**Middleware:** `authenticate`

**Logic:** Kiểm tra quyền sở hữu -> cascading delete (likes, shares, comments, poll, votes...).

---

### E9. Like bài viết - POST `/:postId/like`

**Middleware:** `authenticate`

**Logic:**
1. Kiểm tra post tồn tại -> throw 404
2. Kiểm tra chưa like -> đã like: throw 409
3. Tạo Like record
4. Tạo Notification (type: LIKE) cho tác giả (nếu không phải chính mình)

---

### E10. Unlike bài viết - DELETE `/:postId/like`

**Middleware:** `authenticate`

**Logic:** Xóa Like record. Throw 400 nếu chưa like.

---

### E11. Bình chọn Poll - POST `/:postId/vote`

**Middleware:** `authenticate`

**Request Body:**
```typescript
{
  optionId: string  // UUID của option được chọn
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": "uuid",
      "question": "Môn nào khó nhất?",
      "options": [
        { "id": "uuid", "text": "DSA", "order": 0, "_count": { "votes": 16 } },
        { "id": "uuid", "text": "OS", "order": 1, "_count": { "votes": 8 } }
      ]
    },
    "votedOptionId": "uuid"
  }
}
```

**Logic:**
1. Kiểm tra post có poll -> throw 404
2. Kiểm tra option hợp lệ -> throw 400
3. Nếu đã vote option khác -> update vote
4. Nếu chưa vote -> tạo mới
5. Trả poll updated với vote counts

---

### E12. Hủy bình chọn - DELETE `/:postId/vote`

**Middleware:** `authenticate`

---

### E13. Share/Repost - POST `/:postId/share`

**Middleware:** `authenticate`

**Logic:** Tạo Share record. Throw 404 / 409.

---

### E14. Unshare - DELETE `/:postId/share`

**Middleware:** `authenticate`

---

### E15. Lấy Comments - GET `/:postId/comments`

**Middleware:** `optionalAuth`

**Query:** `page`, `limit`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Comment hay quá!",
      "postId": "uuid",
      "authorId": "uuid",
      "parentId": null,
      "author": {
        "id": "uuid",
        "fullName": "Nguyễn Văn B",
        "avatar": "https://...",
        "isVerified": true
      },
      "likesCount": 5,
      "repliesCount": 3,
      "sharesCount": 0,
      "isLiked": false,
      "isShared": false,
      "replies": [
        {
          "id": "uuid",
          "content": "Reply...",
          "author": { "..." }
        }
      ],
      "createdAt": "2026-04-20T11:00:00.000Z"
    }
  ],
  "pagination": { "..." }
}
```

**Logic:**
- Chỉ lấy top-level comments (`parentId: null`)
- Include **3 replies đầu tiên** cho mỗi comment
- Sắp xếp `createdAt` DESC

---

### E16. Tạo Comment - POST `/:postId/comments`

**Middleware:** `authenticate`, `validateBody(createCommentSchema)`

**Request Body:**
```typescript
{
  content: string,    // required, min 1, max 2000 ký tự
  parentId?: string   // optional UUID - reply to comment
}
```

**Response (201 CREATED):** Comment object.

**Logic:**
1. Kiểm tra post tồn tại
2. Tạo comment (hoặc reply nếu có parentId)
3. Tạo Notification (type: COMMENT) cho tác giả bài viết

---

### E17. Xóa Comment - DELETE `/comments/:commentId`

**Middleware:** `authenticate`

**Logic:** Kiểm tra quyền sở hữu -> cascading delete (replies, likes).

---

### E18. Lấy Replies - GET `/comments/:commentId/replies`

**Middleware:** `optionalAuth`

**Logic:** Sắp xếp `createdAt` ASC (thứ tự tự nhiên của reply).

---

### E19-E20. Like/Unlike Comment

- POST `/comments/:commentId/like` -> Tạo CommentLike + Notification
- DELETE `/comments/:commentId/like` -> Xóa CommentLike

---

### E21-E22. Share/Unshare Comment

- POST `/comments/:commentId/share` -> Tạo CommentShare
- DELETE `/comments/:commentId/share` -> Xóa CommentShare

---

### E23. Lấy Comment đã Share - GET `/user/:userId/comment-shares`

**Middleware:** `optionalAuth`

**Logic:** Lấy tất cả comments user đã share, kèm post gốc. Sắp xếp theo share `createdAt` DESC.

---

## F. Module Chat (`/api/v1/chat`)

**File locations:**
- Routes: `backend/src/modules/chat/chat.routes.ts`
- Controller: `backend/src/modules/chat/chat.controller.ts`
- Service: `backend/src/modules/chat/chat.service.ts`

**Tất cả routes đều require `authenticate`.**

---

### F1. Lấy/Tạo Conversation - GET `/conversations/user/:userId`

**Logic:** Tìm conversation PRIVATE giữa 2 user (context: SOCIAL). Nếu chưa có -> tạo mới.

**Response:** Conversation object với participants (flattened, kèm `isOnline` status).

---

### F2. Chi tiết Conversation - GET `/conversations/:conversationId`

**Logic:** Kiểm tra user là participant -> throw 403 nếu không phải.

---

### F3. Danh sách Conversations - GET `/conversations`

**Query:** `page`, `limit`

**Logic:** Chỉ lấy conversations context `SOCIAL` (không lấy DATING). Sắp xếp theo `updatedAt` DESC (conversation mới nhất lên đầu).

---

### F4. Lấy tin nhắn - GET `/conversations/:conversationId/messages`

**Query:** `page`, `limit`

**Response:** Messages kèm sender info, read status, shared post details (nếu type: POST).

---

### F5. Gửi tin nhắn - POST `/conversations/:conversationId/messages`

**Request Body:**
```typescript
{
  content: string,
  type?: string,       // default: 'TEXT' (TEXT | IMAGE | VIDEO | AUDIO | FILE | POST)
  mediaUrl?: string,   // URL file đã upload
  postId?: string      // ID bài viết được share
}
```

**Response (201 CREATED):** Message object.

**Logic:**
1. Normalize message type thành uppercase
2. Tạo message trong DB
3. Tạo MessageReadStatus cho sender (đánh dấu đã đọc)
4. Cập nhật conversation: `lastMessageContent`, `lastMessageSenderId`, `lastMessageCreatedAt`
5. Cập nhật `lastActiveAt` của sender
6. Gửi push notification cho participant khác (async, non-blocking)

---

### F6. Đánh dấu đã đọc - POST `/conversations/:conversationId/read`

**Logic:** Tạo MessageReadStatus cho tất cả tin nhắn chưa đọc từ người khác.

---

### F7. Xóa tin nhắn - DELETE `/messages/:messageId`

**Logic:** Chỉ sender mới có quyền xóa.

---

### F8. Số tin chưa đọc - GET `/unread-count`

**Response:**
```json
{
  "success": true,
  "data": { "unreadCount": 5 }
}
```

**Logic:** Đếm tin nhắn chưa đọc chỉ từ conversations context `SOCIAL`.

---

### Socket.io Events (Real-time)

**Setup:** Socket.io chạy cùng server HTTP trên port 3001. CORS enabled (origin: '*').

| Event | Hướng | Payload | Logic |
|-------|-------|---------|-------|
| `join` | Client -> Server | `userId: string` | `socket.join(userId)` - tham gia room cá nhân |
| `sendMessage` | Client -> Server | `{ participants: string[], ...messageData }` | Broadcast `newMessage` đến mỗi participant room |
| `newMessage` | Server -> Client | Message object | Nhận tin nhắn mới (kèm conversationId) |
| `typing` | Client -> Server | `{ conversationId: string, ...typingData }` | Emit `userTyping` đến conversation room |
| `userTyping` | Server -> Client | Typing info | Nhận trạng thái đang gõ |

**Online Status:** User được coi là online nếu `lastActiveAt` trong vòng **5 phút** gần nhất (ONLINE_THRESHOLD_MS = 300,000ms).

---

## G. Module Notification (`/api/v1/notifications`)

**File locations:**
- Routes: `backend/src/modules/notification/notification.routes.ts`
- Controller: `backend/src/modules/notification/notification.controller.ts`
- Service: `backend/src/modules/notification/notification.service.ts`

**Tất cả routes đều require `authenticate`.**

---

### G1. Lấy danh sách Notifications - GET `/`

**Query:** `page`, `limit`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "LIKE",
      "content": "đã thích bài viết của bạn",
      "isRead": false,
      "referenceId": "post-uuid",
      "sender": {
        "id": "uuid",
        "fullName": "Nguyễn Văn B",
        "avatar": "https://..."
      },
      "createdAt": "2026-04-20T15:00:00.000Z"
    }
  ],
  "pagination": { "..." }
}
```

**Notification Types:**
| Type | Khi nào tạo |
|------|-------------|
| `LIKE` | Ai đó like bài viết/comment của bạn |
| `COMMENT` | Ai đó comment bài viết của bạn |
| `FOLLOW` | Ai đó follow bạn |
| `MENTION` | Ai đó mention bạn |
| `SYSTEM` | Thông báo hệ thống |

---

### G2. Số thông báo chưa đọc - GET `/unread-count`

**Response:** `{ unreadCount: number }`

---

### G3. Đánh dấu đã đọc - POST `/:notificationId/read`

---

### G4. Đánh dấu tất cả đã đọc - POST `/mark-all-read`

---

### G5. Xóa thông báo - DELETE `/:notificationId`

---

### G6. Xóa tất cả - DELETE `/`

---

### G7. Đăng ký Device Token - POST `/device`

**Request Body:**
```typescript
{
  token: string,       // FCM device token
  platform: string     // 'ios' | 'android'
}
```

**Logic:** Lưu device token để gửi push notification qua Firebase Cloud Messaging.

---

### G8. Hủy đăng ký Device - DELETE `/device`

**Request Body:**
```typescript
{
  token: string
}
```

---

## H. Frontend (Mobile) - Người 2

### H1. HomeScreen (`src/screens/home/HomeScreen.tsx`)

**UI Elements:**
- Header: Logo center, notification icon (trái), search icon (phải)
- Feed FlatList với post cards
- Image carousel (single/multi-image, pagination dots)
- Poll voting component với vote counting
- Post card: avatar, name, timestamp, content, media, interactions bar
- Interaction bar: Like (heart), Comment (chat bubble), Repost (repeat), Share (paper-plane)
- Bottom menu: delete/hide/report
- Share post modal
- Confirmation dialog cho deletion

**API calls:**
- `GET /posts/feed` - lấy feed
- `POST /posts/{id}/like` & `DELETE /posts/{id}/like` - like/unlike
- `POST /posts/{id}/vote` - vote poll
- `DELETE /posts/{id}` - xóa bài
- `POST /posts/{id}/share` - share

**State:** `useAuthStore`, `usePostActions` hook
**Navigation:** -> PostDetailScreen, UserProfileScreen, NotificationScreen, SearchScreen

---

### H2. CreatePostScreen (`src/screens/home/CreatePostScreen.tsx`)

**UI Elements:**
- User avatar + name header
- Rich text input (max 1000 chars, character counter)
- Image/video picker (expo-image-picker)
- Poll builder: thêm/xóa options
- Location/tag features
- Button "Đăng" với upload progress indicator

**API calls:**
- `POST /posts` - tạo bài viết
- `POST /media/upload` hoặc `/media/upload/multiple` - upload media

---

### H3. PostDetailScreen (`src/screens/home/PostDetailScreen.tsx`)

**UI Elements:**
- Full post với tất cả interactions
- Comments list với nested replies
- Comment input field
- Edit/delete post options (tác giả)
- Like/reply comment

**API calls:**
- `GET /posts/{id}` - chi tiết bài viết
- `GET /posts/{id}/comments` - lấy comments
- `POST /posts/{id}/comments` - tạo comment
- `DELETE /posts/comments/{id}` - xóa comment
- `POST /posts/comments/{id}/like` - like comment

---

### H4. ChatListScreen (`src/screens/chat/ChatListScreen.tsx`)

**UI Elements:**
- Header "Nhắn tin" + button tạo tin nhắn mới
- Search bar (filter client-side)
- Online users horizontal scroll (avatar + green dot indicator)
- Conversation list:
  - Avatar + online status indicator
  - Name + last message preview
  - Timestamp (formatted: "vừa xong", "5 phút trước", "hôm qua")
  - Unread count badge
  - Mute icon (nếu tắt thông báo)

**API calls:** `GET /chat/conversations`
**Navigation:** -> ChatRoomScreen

---

### H5. ChatRoomScreen (`src/screens/chat/ChatRoomScreen.tsx`)

**UI Elements:**
- Custom header: avatar, name, online status, call/video icons
- Message FlatList:
  - Message bubbles (own: phải, blue | other: trái, gray)
  - Avatar cho tin nhắn người khác
  - Timestamp separators (hiện khi cách > 5 phút)
  - Message status: sending -> sent -> delivered -> read
  - Shared post cards (preview + stats)
  - Voice message player (waveform + duration)
  - Image messages
- Text input + emoji button + attachment button
- Voice recording UI: cancel/send controls
- Typing indicator animation (3 dots)

**API calls:**
- `GET /chat/conversations/{id}` hoặc `/chat/conversations/user/{userId}`
- `GET /chat/conversations/{id}/messages`
- `POST /chat/conversations/{id}/messages`
- `POST /chat/conversations/{id}/read`
- `POST /media/upload` - upload voice message

**Socket events:** `sendMessage`, `newMessage`, `typing`, `userTyping`
**Hooks:** `useVoiceRecorder`

---

### H6. NotificationScreen (`src/screens/notification/NotificationScreen.tsx`)

**UI Elements:**
- Header + unread count badge
- Filter chips: Tất cả, Follows, Likes, Comments
- Grouped by date: Hôm nay, Hôm qua, Tuần này, Trước đó
- NotificationItem:
  - Avatar + colored icon badge (mỗi type 1 màu)
  - Body text: **bold actor name** + action text
  - Time label
  - Button "Follow lại" (cho FOLLOW notifications)
  - Unread indicator dot (chấm xanh)
- Menu: "Đánh dấu tất cả đã đọc", "Xóa tất cả"
- Haptics feedback

**API calls:**
- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/mark-all-read`
- `DELETE /notifications`
- `POST /users/{id}/follow` - follow back từ notification

**Navigation:** Route đến PostDetailScreen, UserProfileScreen, ChatRoomScreen tùy theo notification type.

---

## Database Models - Người 2

### Post
```
id           String      @id @default(uuid())
content      String?
authorId     String      -> User
privacy      PostPrivacy @default(PUBLIC)  (PUBLIC | FOLLOWERS | PRIVATE)
locationName String?
latitude     Float?
longitude    Float?
createdAt    DateTime    @default(now())
updatedAt    DateTime    @updatedAt
@@index([authorId])
@@index([createdAt])
```

### Poll
```
id        String    @id @default(uuid())
postId    String    @unique -> Post
question  String?
expiresAt DateTime?
createdAt DateTime  @default(now())
```

### PollOption
```
id     String @id @default(uuid())
pollId String -> Poll
text   String
order  Int    @default(0)
```

### PollVote
```
id        String   @id @default(uuid())
optionId  String   -> PollOption
voterId   String
createdAt DateTime @default(now())
@@unique([optionId, voterId])
```

### Comment
```
id        String   @id @default(uuid())
content   String
authorId  String   -> User
postId    String   -> Post
parentId  String?  -> Comment (self-relation, nested replies)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
@@index([postId])
@@index([authorId])
@@index([parentId])
```

### Like
```
id        String   @id @default(uuid())
userId    String   -> User
postId    String   -> Post
createdAt DateTime @default(now())
@@unique([userId, postId])
```

### CommentLike
```
id        String   @id @default(uuid())
userId    String   -> User
commentId String   -> Comment
createdAt DateTime @default(now())
@@unique([userId, commentId])
```

### Share
```
id        String   @id @default(uuid())
userId    String   -> User
postId    String   -> Post
createdAt DateTime @default(now())
@@unique([userId, postId])
```

### CommentShare
```
id        String   @id @default(uuid())
userId    String   -> User
commentId String   -> Comment
createdAt DateTime @default(now())
@@unique([userId, commentId])
```

### Conversation
```
id                   String              @id @default(uuid())
type                 ConversationType    @default(PRIVATE)  (PRIVATE | GROUP)
context              ConversationContext @default(SOCIAL)   (SOCIAL | DATING)
name                 String?
avatar               String?
participantAId       String?
participantBId       String?
lastMessageContent   String?
lastMessageSenderId  String?
lastMessageCreatedAt DateTime?
createdAt            DateTime @default(now())
updatedAt            DateTime @updatedAt
@@unique([participantAId, participantBId, context])
```

### ConversationParticipant
```
id             String   @id @default(uuid())
conversationId String   -> Conversation
userId         String   -> User
joinedAt       DateTime @default(now())
@@unique([conversationId, userId])
```

### Message
```
id             String      @id @default(uuid())
conversationId String      -> Conversation
senderId       String      -> User
content        String
type           MessageType @default(TEXT)  (TEXT | IMAGE | VIDEO | AUDIO | FILE | POST)
mediaUrl       String?
isRead         Boolean     @default(false)
sharedPostId   String?     -> Post
createdAt      DateTime    @default(now())
updatedAt      DateTime    @updatedAt
@@index([conversationId, createdAt(sort: Desc)])
```

### MessageReadStatus
```
id        String   @id @default(uuid())
messageId String   -> Message
userId    String   -> User
readAt    DateTime @default(now())
@@unique([messageId, userId])
```

### Notification
```
id          String           @id @default(uuid())
type        NotificationType (LIKE | COMMENT | FOLLOW | MENTION | SYSTEM)
content     String?
isRead      Boolean          @default(false)
senderId    String?          -> User
receiverId  String           -> User
referenceId String?          (postId, commentId, etc.)
createdAt   DateTime         @default(now())
@@index([receiverId])
@@index([senderId])
@@index([createdAt])
```

---

# PRESENTER: Thuyết Trình & Demo

> **Nguyên tắc thuyết trình:** Trình bày theo hướng **nghiệp vụ và giá trị sản phẩm**, không sa đà vào kỹ thuật. Giảng viên/hội đồng muốn nghe: **Tại sao sản phẩm này cần tồn tại? Nó giải quyết vấn đề gì? Tại sao sinh viên nên dùng nó?**

---

## 1. Cấu trúc Slide đề xuất

### Slide 1-2: Mở đầu ấn tượng

**Slide 1 - Câu hỏi mở:**
> *"Mỗi ngày, 15.000+ sinh viên PTIT online trên Facebook, Zalo, Instagram... nhưng khi muốn tìm bạn cùng lớp để hỏi bài, tìm anh chị khóa trên để xin kinh nghiệm, hay đơn giản là kết bạn mới trong trường - các bạn mở app nào?"*

**Slide 2 - Giới thiệu sản phẩm:**
- Tên: **PTIT Social** - Mạng xã hội dành riêng cho sinh viên PTIT
- Slogan: *"Kết nối đúng người, đúng trường, đúng lúc"*
- Nhóm thực hiện: [Tên thành viên]
- Giảng viên hướng dẫn: [Tên GV]

---

### Slide 3-5: Vấn đề thực tế (Problem Statement)

**Slide 3 - Sinh viên PTIT đang gặp khó khăn gì?**

| Vấn đề | Thực trạng |
|--------|-----------|
| **Kết nối rời rạc** | Thông tin sinh viên nằm rải rác trên Facebook groups, Zalo nhóm, email. Không có 1 nơi tập trung |
| **Khó tìm đúng người** | Muốn tìm bạn cùng khoa CNTT khóa 2021? Phải hỏi lung tung trên groups |
| **Không có danh tính xác thực** | Trên Facebook/Zalo, ai cũng có thể giả mạo sinh viên PTIT |
| **Kết bạn/hẹn hò khó** | Tinder/Bumble không filter được "cùng trường", "cùng khoa", "cùng khóa" |
| **Thông tin academic rời rạc** | Hỏi bài, chia sẻ tài liệu, thảo luận môn học phải qua group Facebook lộn xộn |

**Slide 4 - Tại sao Facebook/Zalo/Instagram không giải quyết được?**

| Nền tảng | Hạn chế cho sinh viên PTIT |
|----------|---------------------------|
| **Facebook** | Quá đông đúc, quảng cáo nhiều, thuật toán ẩn bài viết, không verify sinh viên thật, groups lộn xộn |
| **Zalo** | Thiên về nhắn tin, không có feed/community mạnh, không có dating, không verify student ID |
| **Instagram** | Thiên về hình ảnh/lifestyle, không có chat nhóm tốt, không phù hợp thảo luận học tập |
| **Tinder/Bumble** | Không filter được cùng trường/khoa/khóa, phải trả phí cao, không có tính năng social |
| **Twitter/X** | Hướng global, không có community nội bộ, ngôn ngữ chủ yếu tiếng Anh |

**Slide 5 - Khoảng trống thị trường:**
> *"Chưa có nền tảng nào kết hợp mạng xã hội + nhắn tin real-time + hẹn hò trong cùng một hệ sinh thái, dành RIÊNG cho sinh viên PTIT với danh tính xác thực."*

---

### Slide 6-8: Giải pháp - PTIT Social (Solution)

**Slide 6 - Tổng quan giải pháp:**

PTIT Social là **nền tảng all-in-one** cho sinh viên PTIT gồm 3 trụ cột:

```
+---------------------------+
|      PTIT Social          |
+---------------------------+
|                           |
|  1. SOCIAL NETWORK        |  Đăng bài, like, comment, share, poll
|     (Kết nối)             |  Follow bạn bè, feed cá nhân
|                           |
|  2. REAL-TIME MESSAGING   |  Chat 1-1, voice message
|     (Trò chuyện)          |  Chia sẻ bài viết trong chat
|                           |
|  3. CAMPUS DATING         |  Match theo trường/khoa/khóa
|     (Hẹn hò)             |  Swipe, Super Like, Premium
|                           |
+---------------------------+
|  XÁC THỰC DANH TÍNH      |  Mã sinh viên + Email OTP + 2FA
|  (Nền tảng an toàn)       |  Chỉ sinh viên PTIT thật mới vào được
+---------------------------+
```

**Slide 7 - Tại sao PTIT Social, không phải app khác?**

| Tiêu chí | Facebook | Zalo | Tinder | **PTIT Social** |
|----------|:--------:|:----:|:------:|:-----------:|
| Xác thực sinh viên (Student ID) | - | - | - | **+** |
| Feed bài viết | + | - | - | **+** |
| Chat real-time | + | + | + | **+** |
| Voice message | + | + | - | **+** |
| Hẹn hò campus | - | - | +/- | **+** |
| Filter theo khoa/khóa | - | - | - | **+** |
| Poll/Bình chọn | + | - | - | **+** |
| Không quảng cáo | - | - | - | **+** |
| Cộng đồng nội bộ PTIT | - | - | - | **+** |
| Dark mode | + | + | + | **+** |
| Push notification | + | + | + | **+** |
| Miễn phí | +/- | + | +/- | **+** |

**Slide 8 - Unique Selling Points (USP):**

> **USP 1: "Chỉ sinh viên PTIT thật"**
> - Đăng ký bằng mã sinh viên (B21DCCN001, T24...)
> - Email OTP xác thực
> - 2FA bảo vệ tài khoản (Google Authenticator)
> - Không fake account, không spam

> **USP 2: "Hẹn hò đúng người cùng trường"**
> - Match theo khoa (CNTT, Viễn thông, ATTT...)
> - Filter cùng khóa (cùng năm nhập học)
> - Tính khoảng cách trong campus (GPS)
> - Thuật toán scoring: tuổi (30đ) + giới tính (20đ) + khoa (20đ) + cùng khóa (10đ) + profile hoàn thiện (10đ) + hoạt động gần đây (10đ)

> **USP 3: "All-in-one, không cần mở 5 app"**
> - Feed + Chat + Dating + Notification trong 1 app duy nhất
> - Thấy bài hay? Nhấn share vào chat luôn
> - Match xong? Tự động tạo conversation, chat ngay

---

### Slide 9-10: Đối tượng người dùng (Target Users)

**Slide 9 - User Personas:**

**Persona 1: Tân sinh viên (Năm 1)**
- *"Mình mới nhập học, chưa quen ai. Muốn tìm bạn cùng lớp, cùng khoa."*
- Nhu cầu: Kết bạn, tìm nhóm học, hỏi thông tin
- PTIT Social giúp: Search theo khoa/lớp, follow, chat ngay

**Persona 2: Sinh viên năm 2-3 (Active user)**
- *"Muốn chia sẻ kinh nghiệm, tìm bạn làm project, tham gia cộng đồng."*
- Nhu cầu: Đăng bài, tạo poll hỏi ý kiến, thảo luận
- PTIT Social giúp: Feed, poll, comment, voice message

**Persona 3: Sinh viên muốn hẹn hò**
- *"Muốn quen bạn khác khoa nhưng không biết bắt đầu từ đâu."*
- Nhu cầu: Tìm người phù hợp trong trường, an toàn
- PTIT Social giúp: Dating với filter khoa/khóa, verified profile, match tự động tạo chat

**Persona 4: Sinh viên năm cuối / Cựu sinh viên**
- *"Muốn kết nối lại với bạn cũ, chia sẻ cơ hội việc làm."*
- Nhu cầu: Networking, chia sẻ thông tin tuyển dụng
- PTIT Social giúp: Profile với thông tin faculty/class, search theo tên/MSSV

**Slide 10 - Quy mô thị trường:**
- Học viện CNBCVT có **~15.000 sinh viên** (cả 2 cơ sở HN + HCM)
- Mỗi năm tuyển mới **~3.000-4.000 sinh viên**
- 100% sinh viên có smartphone
- Potential users year 1: **5.000-8.000** (early adopters)
- Có thể mở rộng sang các trường đại học khác (HUST, UET, VNU...)

---

### Slide 11-13: Tính năng chi tiết (Features Walkthrough)

**Slide 11 - Social Network:**

| Tính năng | Mô tả | Giá trị cho sinh viên |
|-----------|-------|----------------------|
| **Đăng bài viết** | Text + ảnh + video + vị trí | Chia sẻ khoảnh khắc campus, tài liệu học tập |
| **Poll/Bình chọn** | Tạo poll 2-4 options | "Môn nào khó nhất kỳ này?", "Quán ăn nào ngon gần trường?" |
| **Like/Comment/Share** | Tương tác bài viết | Xây dựng cộng đồng, thảo luận |
| **Follow** | Theo dõi bạn bè/anh chị | Cập nhật thông tin từ người quan tâm |
| **Tìm kiếm** | Search theo tên, MSSV | Tìm đúng người cần tìm trong trường |
| **Profile cá nhân** | Avatar, cover, bio, bài hát yêu thích | Thể hiện cá tính, kết nối qua sở thích |

**Slide 12 - Real-time Messaging:**

| Tính năng | Mô tả | Giá trị cho sinh viên |
|-----------|-------|----------------------|
| **Chat 1-1** | Nhắn tin trực tiếp | Trao đổi nhanh, hỏi bài |
| **Tin nhắn thoại** | Ghi âm & gửi voice message | Tiện khi đang di chuyển, giải thích dài |
| **Chia sẻ bài viết** | Share post vào chat | "Ê xem bài này hay nè" |
| **Trạng thái online** | Biết ai đang online | Biết lúc nào bạn rảnh để chat |
| **Typing indicator** | "đang nhập..." | Trải nghiệm tự nhiên như chat trực tiếp |
| **Push notification** | Thông báo tin nhắn mới | Không bỏ lỡ tin nhắn quan trọng |

**Slide 13 - Campus Dating (PTIT Connect):**

| Tính năng | Mô tả | Giá trị cho sinh viên |
|-----------|-------|----------------------|
| **Swipe matching** | Like / Unlike / Super Like | Dễ dùng, quen thuộc |
| **Filter thông minh** | Theo khoa, khóa, tuổi, khoảng cách | Tìm người THẬT SỰ phù hợp |
| **Profile phong phú** | 6 ảnh, câu hỏi mở, bài hát yêu thích | Hiểu nhau trước khi match |
| **Verified identity** | MSSV hiển thị trên dating profile | An toàn, không fake |
| **Auto-chat on match** | Match = tự động tạo phòng chat | Không cần thêm bước, chat ngay |
| **Premium** | Unlimited swipes, Super Like, Rewind | Thanh toán VNPay/VietQR (tiện cho SV Việt) |

---

### Slide 14-15: Lợi thế cạnh tranh (Competitive Advantage)

**Slide 14 - So sánh trực tiếp:**

```
                     Facebook    Zalo    Tinder    PTIT Social
                     ────────    ────    ──────    ───────────
An toàn/Verified      Thấp      Thấp    Trung     ██████ CAO
Tìm đúng người PTIT  Khó       Khó     Không     ██████ DỄ
Hẹn hò campus        Không     Không    Chung     ██████ RIÊNG
Feed + Chat + Date    2 app     1 app   1 app     ██████ 1 APP
Không quảng cáo       ✗         ✗       ✗         ██████ ✓
Tiếng Việt native     ✓/✗       ✓       ✗         ██████ ✓
Thanh toán VN (VNPay) ✗         ✗       ✗         ██████ ✓
```

**Slide 15 - Mô hình kinh doanh tiềm năng:**

| Nguồn thu | Mô tả |
|-----------|-------|
| **Freemium Dating** | Free: 50 swipes/ngày, 1 Super Like. Premium: unlimited, 5 Super Likes, Rewind |
| **Thanh toán nội địa** | VNPay, VietQR, SePay - phù hợp sinh viên Việt Nam (không cần thẻ quốc tế) |
| **Gói subscription** | Monthly / Quarterly / Yearly (giảm giá khi mua dài hạn) |
| **Mở rộng trường khác** | Mô hình có thể nhân bản sang HUST, UET, FPT University... |

---

### Slide 16-18: Demo sản phẩm

*(Xem mục "Kịch bản Demo" bên dưới)*

---

### Slide 19-20: Kết luận & Tầm nhìn

**Slide 19 - Kết quả đạt được:**
- Xây dựng thành công nền tảng all-in-one: Social + Chat + Dating
- 21 bảng database, ~60 API endpoints, 30+ màn hình mobile
- Xác thực danh tính nhiều lớp (MSSV + Email OTP + 2FA)
- Chat real-time với Socket.io, push notification
- Hệ thống dating với thuật toán matching thông minh
- Thanh toán Việt Nam (VNPay/VietQR)
- Cross-platform: iOS + Android từ 1 codebase (React Native)

**Slide 20 - Tầm nhìn phát triển:**

```
Giai đoạn 1 (Hiện tại): PTIT Social - Mạng xã hội sinh viên PTIT
     ↓
Giai đoạn 2: Mở rộng tính năng
  - Group Chat (nhóm lớp, nhóm CLB)
  - Story/Reel (nội dung ngắn)
  - Video/Voice Call
  - Admin Dashboard
     ↓
Giai đoạn 3: Mở rộng quy mô
  - UniSocial - Nền tảng cho TẤT CẢ đại học Việt Nam
  - Mỗi trường có instance riêng
  - Kết nối liên trường (inter-university networking)
     ↓
Giai đoạn 4: Hệ sinh thái
  - Marketplace (mua bán đồ cũ giữa SV)
  - Job Board (tuyển dụng/thực tập)
  - Event Management (sự kiện trường)
  - Alumni Network (cựu sinh viên)
```

> *"PTIT Social không chỉ là một đồ án - đây là nền tảng có thể trở thành UniSocial, mạng xã hội cho mọi sinh viên Việt Nam."*

---

## 2. Sơ đồ cần chuẩn bị

### 2.1 ERD (Entity Relationship Diagram)

**Các bảng chính và quan hệ:**

```
User (1) ----< (N) Post
User (1) ----< (N) Comment
User (1) ----< (N) Like
User (1) ----< (N) Share
User (M) ----< Follow >---- (N) User  (self-referential)
User (1) ----< (N) Notification (as sender/receiver)

Post (1) ----< (N) Comment
Post (1) ----< (N) Like
Post (1) ----< (N) Share
Post (1) ----< (N) Media
Post (1) ---- (0..1) Poll
Poll (1) ----< (N) PollOption
PollOption (1) ----< (N) PollVote

Comment (1) ----< (N) Comment (self-referential: replies)
Comment (1) ----< (N) CommentLike
Comment (1) ----< (N) CommentShare

User (M) ----< ConversationParticipant >---- (N) Conversation
Conversation (1) ----< (N) Message
Message (1) ----< (N) MessageReadStatus

User (1) ----< (N) RefreshToken
User (1) ----< (N) VerificationCode
User (1) ----< (N) DeviceToken
User (M) ----< UserBlock >---- (N) User
```

### 2.2 System Architecture

```
+-------------------+          +------------------+
|   React Native    |  HTTP    |                  |
|   Expo 54 App     |--------->|   Express.js     |
|   (TypeScript)    |<---------|   (Port 3001)    |
|                   |          |                  |
|   - Zustand       | Socket.io|   - Prisma ORM   |
|   - React Query   |<=======>|   - JWT Auth     |
|   - Axios         |          |   - Zod Valid.   |
+-------------------+          +--------+---------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
            +-------v------+   +-------v------+   +-------v------+
            |  PostgreSQL  |   |    Redis     |   |    MinIO     |
            |  (Port 5434) |   |   (Cache)    |   |  (Storage)   |
            |              |   |              |   |              |
            |  21 Tables   |   |  Sessions    |   |  Avatars     |
            |  Single DB   |   |  Rate Limit  |   |  Posts       |
            +--------------+   +--------------+   +--------------+
                                                         |
                                        +----------------v---------+
                                        |   Firebase Cloud         |
                                        |   Messaging (FCM)        |
                                        |   Push Notifications     |
                                        +--------------------------+
```

### 2.3 Auth Flow

```
Register -> Input (email, password, studentId)
         -> Hash password (bcrypt, salt: 12)
         -> Create User (isVerified: false)
         -> Generate OTP (6 digits, 15min expiry)
         -> Send Email (SMTP/Nodemailer)
         -> Return JWT tokens

Verify Email -> Input OTP code
             -> Verify & consume code
             -> Set isVerified = true

Login -> Input (email, password, ?2FA code)
      -> Check isVerified
      -> Compare password (bcrypt)
      -> Check 2FA enabled?
         -> Yes: Verify TOTP code (otplib)
         -> No: Skip
      -> Generate tokens (access + refresh)
      -> Return user + tokens

Token Refresh -> Send refreshToken
              -> Verify signature
              -> Check DB exists & not expired
              -> Delete old token
              -> Generate new pair
              -> Return new tokens
```

### 2.4 Real-time Chat Flow

```
1. User A opens app
   -> Socket.connect()
   -> Emit 'join' with userId
   -> Server: socket.join(userId)

2. User A sends message
   -> POST /chat/conversations/{id}/messages (HTTP)
      -> Save to DB
      -> Create read status for sender
      -> Update conversation.lastMessage
      -> Send push notification (async)
   -> Emit 'sendMessage' (Socket)
      -> Server broadcasts 'newMessage' to each participant room

3. User B receives
   -> Listen 'newMessage' event
   -> Update UI in real-time

4. Typing indicator
   -> User A emits 'typing'
   -> Server emits 'userTyping' to conversation room
   -> User B shows "đang nhập..." animation

5. Online status
   -> Based on lastActiveAt field
   -> Online = lastActiveAt within 5 minutes
   -> Checked on conversation load
```

---

## 3. Kịch bản Demo

> **Nguyên tắc demo:** Kể một câu chuyện người dùng thật, không liệt kê tính năng. Mỗi demo trả lời câu hỏi: "Sinh viên PTIT dùng cái này để làm gì?"

### Demo 1: "Ngày đầu nhập học" - Đăng ký & Tìm bạn (3 phút)

**Kịch bản:** *Minh là tân sinh viên khoa CNTT, vừa nhập học PTIT, chưa quen ai.*

1. **Mở app** -> Màn hình đăng ký đẹp, màu đỏ PTIT
2. **Đăng ký** -> Nhập email, mật khẩu, **mã sinh viên B24DCCN001**
   > *Nhấn mạnh: "Mã sinh viên là danh tính xác thực - chỉ sinh viên PTIT thật mới vào được"*
3. **Xác thực email** -> Nhập OTP 6 số nhận qua email
   > *"Lớp bảo mật đầu tiên - chống tạo tài khoản ảo"*
4. **Vào app** -> Cập nhật profile: avatar, khoa CNTT, lớp D21CQCN01
5. **Tìm kiếm** -> Gõ "CNTT" -> Hiện danh sách sinh viên cùng khoa
   > *"Trên Facebook, bạn không thể search 'sinh viên khoa CNTT PTIT' và ra kết quả chính xác"*
6. **Follow** -> Follow vài bạn cùng khoa -> Nhận notification

---

### Demo 2: "Giờ ra chơi" - Đăng bài & Tương tác (3 phút)

**Kịch bản:** *Minh muốn hỏi ý kiến về môn Cấu trúc dữ liệu và giải thuật.*

1. **Tạo bài viết** -> Nhấn FAB "+" (nút đỏ nổi bật)
2. **Viết bài** -> "Các bạn ơi, môn DSA kỳ này thầy nào dạy dễ hiểu nhất?"
3. **Tạo Poll** -> Thêm 3 options: "Thầy A", "Thầy B", "Thầy C"
   > *"Tính năng Poll giúp thu thập ý kiến cộng đồng nhanh chóng - Facebook không có"*
4. **Đính kèm ảnh** -> Chụp ảnh thời khóa biểu
5. **Đăng bài** -> Bài hiện trên Feed
6. **Tương tác** -> Like (animation heart), Comment "Thầy B hay lắm!", Vote poll
   > *"Mọi tương tác đều tạo notification cho tác giả - không bỏ lỡ phản hồi nào"*

---

### Demo 3: "Hỏi bài lúc 11 giờ đêm" - Chat Real-time (3 phút)

**Kịch bản:** *Minh cần hỏi bạn về bài tập, cần phản hồi ngay.*

1. **Mở Chat** -> Thấy danh sách conversations, online status (chấm xanh)
   > *"Biết ai đang online để hỏi ngay, không cần chờ"*
2. **Nhắn tin** -> Gửi text "Ê, bài tập DSA câu 3 làm sao?"
   > *Tin nhắn hiện real-time trên máy người nhận (demo 2 điện thoại)*
3. **Voice message** -> Ghi âm giải thích cách làm
   > *"Giải thích code bằng voice nhanh hơn gõ text rất nhiều"*
4. **Share bài viết** -> Gửi poll DSA vào chat: "Xem kết quả poll này nè"
   > *"Kết nối feed và chat - thấy bài hay, share vào chat cho bạn ngay"*
5. **Typing indicator** -> Hiện animation "đang nhập..." khi đối phương gõ
6. **Push notification** -> Khi app ở background, vẫn nhận được thông báo

---

### Demo 4: "Cuối tuần chill" - Profile & Kết nối (2 phút)

**Kịch bản:** *Minh muốn cập nhật profile và khám phá cộng đồng.*

1. **Profile** -> Cover photo campus PTIT, avatar, bio "SV năm 2 CNTT - Yêu code & coffee"
2. **Bài hát yêu thích** -> Gắn bài hát đang nghe (tính năng cá nhân hóa)
3. **Stats** -> 15 bài viết, 120 followers, 85 following
   > *"Profile thể hiện bạn là ai trong cộng đồng PTIT"*
4. **Dark Mode** -> Toggle sang giao diện tối
   > *"Học đêm? Dark mode bảo vệ mắt"*
5. **Notification** -> Grouped by "Hôm nay", "Hôm qua" -> Filter "Follows"
   > *"Biết ai vừa follow mình, like bài mình - tất cả ở 1 nơi"*

---

### Demo 5 (Nếu còn thời gian): "Bảo mật" - 2FA (1 phút)

1. **Settings** -> Security -> Bật 2FA
2. **QR Code** -> Quét bằng Google Authenticator
3. **Nhập mã 6 số** -> 2FA enabled
   > *"Tài khoản được bảo vệ 3 lớp: password + email OTP + 2FA. Facebook Groups cũng chưa chắc an toàn bằng"*

---

### Tips trình bày Demo:

| Tip | Chi tiết |
|-----|----------|
| **Dùng 2 thiết bị** | Demo chat real-time giữa 2 máy cùng lúc, ấn tượng hơn video |
| **Chuẩn bị data sẵn** | Tạo sẵn 5-10 tài khoản demo với avatar, bài viết, conversations |
| **Kết nối câu chuyện** | Mỗi demo là 1 tình huống thực tế của sinh viên, không phải "click nút A ra kết quả B" |
| **So sánh ngay** | Sau mỗi tính năng, nói: *"Trên Facebook/Zalo, bạn phải làm X, Y, Z. Ở đây chỉ cần 1 bước"* |
| **Quay video backup** | Phòng trường hợp mất mạng khi demo live |

---

## 4. Chuẩn bị Q&A

### Câu hỏi thường gặp & Gợi ý trả lời

---

### Q1: Tại sao chọn kiến trúc monolith monorepo thay vì microservices?

**Trả lời:**

Dự án có quy mô vừa với team 2-3 người, monolith monorepo là lựa chọn phù hợp nhất vì:

1. **Chia sẻ code**: Folder `/src/` (mobile) và `/backend/` nằm cùng repo, dễ dàng đồng bộ TypeScript types/interfaces giữa frontend và backend mà không cần publish package riêng.

2. **Đơn giản hóa deployment**: Chỉ cần 1 server Express trên port 3001 phục vụ cả HTTP API lẫn Socket.io, thay vì phải deploy và quản lý nhiều service riêng biệt.

3. **Debug dễ hơn**: Khi có bug, chỉ cần trace qua 1 codebase duy nhất. Ví dụ: luồng tạo bài viết đi từ `PostDetailScreen` -> `postService.createPost()` -> `POST /api/v1/posts` -> `postController.createPost()` -> `postService.createPost()` -> Prisma -> PostgreSQL, tất cả trong cùng 1 repo.

4. **Database duy nhất**: Tất cả modules (Auth, User, Post, Chat, Notification, Media) đều dùng chung 1 PostgreSQL database, truy vấn qua Prisma ORM. Không cần xử lý distributed transactions hay eventual consistency.

5. **Chi phí vận hành thấp**: Docker Compose chỉ cần 4 containers (API, PostgreSQL, Redis, MinIO), không cần service mesh, API gateway, hay container orchestration phức tạp.

**Khi nào nên chuyển sang microservices?** Khi số lượng user tăng lên hàng triệu, cần scale riêng module Chat (tốn tài nguyên Socket.io) hoặc module Media (tốn băng thông upload), hoặc khi team mở rộng >10 người.

---

### Q2: Cơ chế xác thực (Authentication) hoạt động như thế nào?

**Trả lời:**

Hệ thống sử dụng **JWT (JSON Web Token)** với cơ chế **Access Token + Refresh Token**:

**Cấu hình** (file `backend/src/config/index.ts`):
- Access Token: hết hạn **7 ngày** (config `JWT_EXPIRES_IN || '7d'`)
- Refresh Token: hết hạn **30 ngày** (config `JWT_REFRESH_EXPIRES_IN || '30d'`)
- Hai secret key riêng biệt: `JWT_SECRET` cho access, `JWT_REFRESH_SECRET` cho refresh

**Luồng hoạt động:**

```
1. User đăng nhập (POST /auth/login)
   -> Backend verify email + password (bcrypt compare)
   -> Generate cặp tokens (accessToken + refreshToken)
   -> Lưu refreshToken vào bảng RefreshToken trong DB
   -> Trả tokens cho client

2. Client gọi API (mọi request)
   -> Gắn header: Authorization: Bearer <accessToken>
   -> Middleware `authenticate` verify token bằng jwt.verify()
   -> Decode ra { userId, email } gắn vào req.user

3. Token hết hạn (401 response)
   -> Axios interceptor tự động bắt lỗi 401
   -> Gọi POST /auth/refresh-token với refreshToken
   -> Backend: verify signature -> kiểm tra token tồn tại trong DB
   -> XÓA refreshToken cũ, tạo cặp token MỚI (rotation)
   -> Lưu refreshToken mới vào DB
   -> Client retry request ban đầu với token mới

4. Đổi mật khẩu / Reset password
   -> Gọi logoutAll(): xóa TẤT CẢ refreshTokens của user
   -> Buộc đăng nhập lại trên mọi thiết bị
```

**Token Rotation** là biện pháp bảo mật quan trọng: mỗi lần dùng refreshToken để lấy token mới, token cũ bị xóa khỏi DB. Nếu attacker đánh cắp refreshToken cũ, nó đã bị invalidate.

**Frontend** (file `src/utils/tokenStorage.ts`): Token được lưu trong **Expo SecureStore** (encrypted storage trên device), không dùng AsyncStorage thông thường.

---

### Q3: Bảo mật API được xử lý ra sao?

**Trả lời:**

Hệ thống áp dụng **7 lớp bảo mật**:

| Lớp | Công nghệ | Chi tiết |
|-----|-----------|----------|
| **1. Rate Limiting** | express-rate-limit | 1000 requests / 15 phút / IP. Trả lỗi "Too many requests" khi vượt quá |
| **2. Security Headers** | Helmet.js | Tự động thêm Content-Security-Policy, X-Frame-Options: DENY, X-XSS-Protection, HSTS |
| **3. Input Validation** | Zod schemas | Mọi request body đều validate qua middleware `validateBody(schema)`. Ví dụ: email phải đúng format, password min 6 ký tự, content max 5000 ký tự, coordinates trong range -90 đến 90 |
| **4. Password Hashing** | bcryptjs | Hash với **salt rounds: 12**. Password không bao giờ trả về trong response (`const { password: _, ...userWithoutSensitive } = user`) |
| **5. SQL Injection** | Prisma ORM | 100% queries đều dùng Prisma API (parameterized queries). Không có raw SQL query nào trong codebase |
| **6. 2FA (TOTP)** | otplib + QR code | Hỗ trợ Google Authenticator. Tắt 2FA yêu cầu cả password LẪN mã 2FA |
| **7. Authorization** | Middleware + ownership check | Mọi mutation đều kiểm tra `post.authorId !== userId` -> throw 403 Forbidden |

**Xử lý lỗi bảo mật** (file `backend/src/middleware/error.middleware.ts`):
- Zod errors: trả chi tiết field nào sai (status 400)
- Prisma errors: trả generic "Database operation failed" (không expose schema)
- Production mode: ẩn error message chi tiết, chỉ trả "Internal server error"
- Không bao giờ expose stack trace trong response

**Forgot Password** có biện pháp chống email enumeration: nếu email không tồn tại, vẫn trả HTTP 200 success (không tiết lộ email có tồn tại hay không).

---

### Q4: Socket.io hoạt động như thế nào? Xử lý khi user offline ra sao?

**Trả lời:**

**Kiến trúc:** Socket.io chạy **cùng server HTTP** trên port 3001 (file `backend/src/index.ts`):

```typescript
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
```

**Luồng gửi tin nhắn** (kết hợp HTTP + Socket):

```
Bước 1: Client gửi HTTP POST /chat/conversations/{id}/messages
  -> Lưu message vào DB (PostgreSQL)
  -> Tạo MessageReadStatus cho sender
  -> Cập nhật conversation.lastMessageContent (denormalization)
  -> Trả HTTP response 201

Bước 2: Client emit socket event 'sendMessage'
  -> Server broadcast 'newMessage' đến room của mỗi participant
  -> io.to(participantId).emit('newMessage', data)

Bước 3: Client nhận socket event 'newMessage'
  -> Update UI real-time (không cần refresh)
```

**Tại sao cần cả HTTP lẫn Socket?**
- HTTP đảm bảo **message persistence** (lưu vào DB)
- Socket chỉ phục vụ **real-time delivery** (best-effort, không retry)
- Nếu Socket fail -> message vẫn an toàn trong DB

**Khi user offline:**
1. Socket tự disconnect -> user rời khỏi room
2. Tin nhắn mới vẫn được lưu vào DB qua HTTP API
3. Push notification được gửi qua **Expo Push API** (async, non-blocking)
4. Khi user mở app lại -> fetch messages qua `GET /chat/conversations/{id}/messages` (phân trang)
5. Gọi `POST /chat/conversations/{id}/read` -> đánh dấu đã đọc

**Online Status:**
- Dựa trên field `lastActiveAt` trong bảng User
- Cập nhật mỗi khi user gửi tin nhắn
- **Online = lastActiveAt trong vòng 5 phút gần nhất** (hằng số `ONLINE_THRESHOLD_MS = 5 * 60 * 1000`)
- Không dùng socket connection status (vì socket có thể reconnect liên tục)

**Typing Indicator:**
```
User A gõ -> emit 'typing' { conversationId, userId }
Server -> broadcast 'userTyping' đến conversation room
User B -> hiển thị animation "đang nhập..." (3 dots)
```

**Frontend** (file `src/services/socket/socketService.ts`): Singleton class, auto-reconnect 10 lần (delay 2s), chỉ dùng WebSocket transport.

---

### Q5: Prisma ORM có ưu/nhược điểm gì so với raw SQL?

**Trả lời:**

**Ưu điểm (tại sao chọn Prisma cho dự án này):**

1. **Type-safe queries**: Mọi query đều có TypeScript type checking. Ví dụ `prisma.post.findMany()` trả về `Post[]` tự động, IDE báo lỗi nếu truy cập field không tồn tại.

2. **Schema-first approach**: Chỉ cần viết 1 file `schema.prisma`, Prisma tự generate:
   - TypeScript types cho tất cả models
   - Migration SQL scripts
   - Client API methods

3. **Migration management**: Dự án có **3 migrations** (Feb-Mar 2026):
   - `add_chat_models` (tạo toàn bộ schema ban đầu)
   - `add_email_verify_2fa` (thêm VerificationCode, 2FA fields)
   - `rename_swipe_pass_to_unlike` (đổi tên enum value)

4. **Relation handling dễ dàng**: Nested includes, connect/disconnect relations.
   ```typescript
   // Ví dụ: lấy post kèm author, media, poll, likes count
   prisma.post.findMany({
     include: {
       author: { select: { id: true, fullName: true, avatar: true } },
       media: true,
       poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
       _count: { select: { likes: true, comments: true, shares: true } }
     }
   })
   ```

5. **Transaction support**: Dùng `prisma.$transaction()` cho các operations cần atomicity. Ví dụ: tạo message + read status + update conversation trong 1 transaction.

**Nhược điểm:**

1. **N+1 queries**: Nếu không cẩn thận với `include`, có thể phát sinh nhiều queries. Dự án xử lý bằng cách dùng `select` và `include` có chọn lọc.

2. **Không hỗ trợ full-text search native**: Tìm kiếm user dùng `contains` filter (LIKE query), không phải full-text search index.

3. **Pagination chỉ offset-based**: Dự án dùng `skip/take` (tương đương OFFSET/LIMIT SQL). Với dataset lớn (>100k records), cursor-based pagination sẽ hiệu quả hơn.

---

### Q6: Tại sao dùng MinIO thay vì lưu file trên server?

**Trả lời:**

**MinIO** là object storage server tương thích **AWS S3 API**. Dự án dùng MinIO vì:

1. **S3-compatible**: Dùng `@aws-sdk/client-s3` để tương tác. Khi deploy production, chỉ cần đổi endpoint URL sang AWS S3 thật, không cần sửa code.

2. **Tách biệt storage khỏi app server**: File không lưu trên ổ cứng server API. MinIO chạy container riêng với volume `minio-data`, dễ backup, migrate, scale.

3. **Public URL riêng biệt**: Config phân biệt `MINIO_INTERNAL_URL` (http://minio:9000 trong Docker network) và `MINIO_PUBLIC_URL` (http://localhost:9000 cho client truy cập). Production có thể đặt CDN trước public URL.

**Tổ chức bucket:**

| Bucket | Nội dung | Resize |
|--------|----------|--------|
| `avatars` | Avatar (512x512) + Cover (1920x1080) | Sharp, JPEG 85% |
| `posts` | Media bài viết (max 1920x1920) | Sharp, JPEG 85% |
| `dating` | Ảnh hẹn hò | Sharp, JPEG 85% |
| `messages` | File đính kèm tin nhắn | Tùy loại |

**Xử lý upload** (file `backend/src/modules/media/media.service.ts`):
1. Multer nhận file vào memory buffer (không ghi disk)
2. Nếu là image (không phải HEIC): Sharp resize + compress JPEG 85%
3. Generate filename: `{uuid}.jpg` (ngăn path traversal, collision-safe)
4. Upload lên MinIO qua S3 PutObject command
5. Trả public URL: `http://localhost:9000/posts/{uuid}.jpg`
6. Lưu metadata vào bảng Media (url, type, size, dimensions)

**Cleanup file cũ**: Khi user đổi avatar, hệ thống parse URL cũ ra bucket+key, gọi DeleteObject xóa file cũ trên MinIO trước khi upload file mới. Nếu xóa fail -> chỉ log warning, không block operation.

---

### Q7: Hệ thống Notification hoạt động như thế nào?

**Trả lời:**

Hệ thống gồm **2 tầng**: In-app notification (database) + Push notification (Expo Push API).

**Tầng 1 - In-app Notification (Database):**

Notification tự động được tạo khi có event:

| Event | Notification Type | Trigger Location |
|-------|-------------------|-----------------|
| Like bài viết | `LIKE` | `postService.likePost()` |
| Comment bài viết | `COMMENT` | `postService.createComment()` |
| Follow user | `FOLLOW` | `userService.followUser()` |
| Like comment | `LIKE` | `postService.likeComment()` |

Điều kiện: **Không tạo notification nếu tự tương tác với bài của mình** (senderId !== receiverId).

Mỗi notification lưu: `type`, `senderId`, `receiverId`, `referenceId` (postId/commentId), `isRead`, `createdAt`.

**Tầng 2 - Push Notification (Expo Push API):**

```
Luồng đăng ký device:
1. App khởi động -> checkPermission() (expo-notifications)
2. Nếu chưa có -> requestPermission()
3. Lấy Expo Push Token: getExpoPushTokenAsync({ projectId })
4. Gửi token lên backend: POST /notifications/device { token, platform: 'ios'|'android' }
5. Backend lưu vào bảng DeviceToken (unique token, isActive: true)

Luồng gửi push:
1. Event xảy ra (ví dụ: có tin nhắn mới)
2. Backend lấy device tokens của receiver: getUserTokens(receiverId)
3. Gửi batch request đến Expo Push API:
   POST https://exp.host/--/api/v2/push/send
   Body: [{ to: token, title: "Tin nhắn mới", body: "Nội dung...", data: { type, conversationId }, sound: 'default', priority: 'high' }]
4. Expo server forward đến APNs (iOS) / FCM (Android)
5. Device hiển thị notification
```

**Xử lý token hết hạn**: Nếu Expo API trả error `DeviceNotRegistered`, backend tự động set `isActive: false` cho token đó, tránh gửi lại lần sau.

**Frontend hiển thị** (file `src/screens/notification/NotificationScreen.tsx`):
- Filter chips: Tất cả / Follows / Likes / Comments
- Group theo thời gian: Hôm nay, Hôm qua, Tuần này, Trước đó
- Unread indicator dot (chấm xanh)
- Button "Follow lại" cho notification type FOLLOW
- Haptics feedback khi tương tác

**Android Notification Channels**: Tạo 2 channel:
- `default`: thông báo chung (MAX importance)
- `dating`: thông báo hẹn hò (HIGH importance, vibration, light color #FF4458)

---

### Q8: Xử lý upload file và media như thế nào?

**Trả lời:**

**Cấu hình** (file `backend/src/config/index.ts`):
- Max file size: **10MB** (`MAX_FILE_SIZE || '10485760'`)
- Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp, image/heic, image/heif, video/mp4, video/quicktime, video/mov, audio/m4a, audio/mp4, audio/mpeg, audio/wav, audio/x-m4a, audio/aac`
- Max files per request: **10** (uploadMultiple)

**Pipeline xử lý:**

```
Request (multipart/form-data)
  -> Multer middleware (memory storage, validate MIME + size)
  -> Sharp image processing (nếu là ảnh)
  -> UUID filename generation
  -> Upload lên MinIO (S3 PutObject)
  -> Lưu metadata vào DB (bảng Media)
  -> Trả response với URL
```

**Resize cụ thể:**

| Loại | Kích thước | Fit mode | Chất lượng |
|------|-----------|----------|------------|
| Avatar | 512 x 512 | `cover` (crop to fill) | JPEG 85% |
| Cover | 1920 x 1080 | `inside` (không crop, không phóng to) | JPEG 85% |
| Post media | 1920 x 1920 | `inside` (không phóng to) | JPEG 85% |
| HEIC/HEIF | Giữ nguyên | Không xử lý | Giữ nguyên |
| Video/Audio | Giữ nguyên | Không xử lý | Giữ nguyên |

**Bảo mật upload:**
- Whitelist MIME type (chỉ cho phép các loại cụ thể)
- UUID filename: `{uuid}.jpg` -> ngăn path traversal attack, không dùng tên file gốc
- File filter reject ngay tại middleware nếu MIME không hợp lệ
- Ownership check khi xóa: chỉ tác giả bài viết mới được xóa media

**Multiple upload** dùng `Promise.all()` -> upload song song tất cả files. Nếu bất kỳ file nào fail -> toàn bộ request fail (all-or-nothing).

---

### Q9: Feed (bảng tin) được generate như thế nào?

**Trả lời:**

Feed hiện tại sử dụng thuật toán **chronological** (sắp xếp theo thời gian, mới nhất lên đầu):

```typescript
// backend/src/modules/post/post.service.ts - getFeed()
const [posts, total] = await Promise.all([
  prisma.post.findMany({
    include: postInclude,  // author, media, poll, _count
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },  // Mới nhất lên đầu
  }),
  prisma.post.count(),
]);
```

**Enrichment sau khi fetch:**
1. Lấy danh sách following của user hiện tại
2. Bulk query: kiểm tra `isLiked` cho tất cả posts (`postId: { in: postIds }`)
3. Bulk query: kiểm tra `isShared` cho tất cả posts
4. Thêm `isFollowing` cho author của mỗi bài

**Pagination**: Offset-based (`skip/take`), default 20 posts/page, max 100.

**Tại sao không dùng algorithmic feed?**
- Dự án hướng đến cộng đồng sinh viên PTIT (quy mô nhỏ-vừa)
- Chronological feed đơn giản, dễ hiểu, phù hợp cho social network nội bộ
- Không cần recommendation engine phức tạp

**Nếu cần cải thiện**: Có thể thêm filter theo following (chỉ hiện bài từ người đang follow), hoặc weighted sort (ưu tiên bài nhiều like/comment).

---

### Q10: Database được thiết kế như thế nào? Có gì đặc biệt?

**Trả lời:**

Database PostgreSQL với **21 bảng chính**, thiết kế qua Prisma schema.

**Design patterns đáng chú ý:**

1. **Self-referential relation (Comment replies)**:
   ```
   Comment.parentId -> Comment.id
   ```
   Cho phép comment lồng nhau (reply). Khi lấy comments, chỉ fetch top-level (`parentId: null`), include 3 replies đầu tiên, load thêm qua API riêng.

2. **Composite unique constraints (ngăn duplicate)**:
   - `Like: @@unique([userId, postId])` -> 1 user chỉ like 1 lần
   - `Follow: @@unique([followerId, followingId])` -> không follow 2 lần
   - `PollVote: @@unique([optionId, voterId])` -> 1 vote/user/poll

3. **Denormalization cho performance (Conversation)**:
   ```
   Conversation.lastMessageContent    -- cache nội dung tin nhắn cuối
   Conversation.lastMessageSenderId   -- cache người gửi cuối
   Conversation.lastMessageCreatedAt  -- cache thời gian cuối
   ```
   Tránh JOIN bảng Message khi hiển thị danh sách conversations. Cập nhật mỗi khi có tin nhắn mới trong transaction.

4. **Conversation uniqueness với context**:
   ```
   @@unique([participantAId, participantBId, context])
   ```
   Cùng 2 user có thể có 2 conversations khác nhau: 1 SOCIAL (chat thường) + 1 DATING (chat hẹn hò). Trick: sort 2 userId trước khi lưu để đảm bảo `participantAId < participantBId`.

5. **Strategic indexing**: Compound index cho query hay dùng:
   ```
   Message: @@index([conversationId, createdAt(sort: Desc)])
   ```
   Tối ưu cho query "lấy tin nhắn mới nhất của conversation X".

6. **Cascade delete**: Xóa User -> cascade xóa tất cả Posts, Comments, Likes, Tokens... Xóa Post -> cascade xóa Comments, Likes, Shares, Poll. Riêng Message.sharedPostId dùng `onDelete: SetNull` (xóa post không xóa message, chỉ null reference).

7. **Transaction usage**: Các operations quan trọng đều dùng `prisma.$transaction()`:
   - Tạo conversation + participants
   - Gửi message + read status + update conversation
   - Swipe + check match + tạo conversation (dating)

---

### Q11: State management trên mobile hoạt động ra sao?

**Trả lời:**

Dùng kết hợp **Zustand** (global state) + **React Query** (server state):

**Zustand** (file `src/store/slices/authSlice.ts`):
- Quản lý: user, tokens, isAuthenticated, isLoading, error
- Persist tokens vào **Expo SecureStore** (encrypted storage)
- Actions: login, register, logout, refreshToken, updateUser

**React Query** (`@tanstack/react-query`):
- Config: `staleTime: 5 phút`, `retry: 2 lần`, `refetchOnWindowFocus: false`
- Dùng cho: fetch feed, conversations, notifications, dating profiles
- Cache invalidation: `queryClient.invalidateQueries()` sau mutation

**Tại sao không dùng Redux?** Zustand nhẹ hơn (không cần boilerplate: actions, reducers, selectors), API đơn giản hơn, performance tốt hơn cho React Native. React Query xử lý server state (caching, refetching, pagination) tốt hơn Redux.

**App initialization** (file `src/hooks/useAuthInitializer.ts`):
```
1. Load tokens từ SecureStore
2. Nếu có token -> restore vào Zustand store
3. Verify với server: GET /auth/me
4. Nếu 401 -> thử refreshToken()
5. Nếu refresh fail -> logout (clear store + SecureStore)
6. Set isInitialized = true -> ẩn splash screen
```

---

### Q12: Xử lý xác thực email và 2FA như thế nào?

**Trả lời:**

**Email Verification (OTP):**

```
1. User đăng ký -> backend tạo OTP 6 số (crypto.randomInt(100000, 999999))
2. Lưu vào bảng VerificationCode:
   - code: "123456"
   - type: EMAIL_VERIFY
   - expiresAt: now + 15 phút
   - isUsed: false
3. Gửi email qua SMTP (Nodemailer, host: smtp.gmail.com)
4. User nhập OTP -> POST /auth/verify-email-public
5. Backend kiểm tra: code đúng + chưa hết hạn + chưa dùng
6. Đánh dấu isUsed = true, cập nhật user.isVerified = true
```

Mỗi lần tạo OTP mới, tất cả OTP cũ chưa dùng của cùng type sẽ bị invalidate (tránh OTP cũ vẫn valid).

**Two-Factor Authentication (2FA - TOTP):**

```
Bước 1: Setup (POST /auth/2fa/setup)
  -> Generate TOTP secret bằng otplib.generateSecret()
  -> Lưu secret vào user.twoFactorSecret (chưa enable)
  -> Tạo QR code URI (otpauth://totp/PTIT%20Social:email?secret=...)
  -> Convert sang QR data URL bằng thư viện qrcode
  -> Trả: { secret, qrCode (base64 PNG), otpauthUrl }
  -> User quét QR bằng Google Authenticator

Bước 2: Enable (POST /auth/2fa/enable)
  -> User nhập mã 6 số từ Authenticator
  -> Backend verify bằng otplib.verifySync(code, secret)
  -> Nếu đúng: set twoFactorEnabled = true
  -> Generate 8 backup codes (crypto.randomBytes(4).toString('hex'))
  -> Trả backup codes cho user lưu trữ

Bước 3: Login với 2FA
  -> User nhập email + password
  -> Backend phát hiện twoFactorEnabled = true
  -> Trả: { requiresTwoFactor: true } (HTTP 200, chưa cấp token)
  -> User nhập mã 2FA -> gửi lại request với twoFactorCode
  -> Backend verify -> cấp tokens

Tắt 2FA: Yêu cầu CẢ password LẪN mã 2FA (ngăn attacker tắt 2FA nếu chỉ có session)
```

---

### Q13: Ứng dụng hỗ trợ Dark Mode không? Hoạt động như thế nào?

**Trả lời:**

Có, hỗ trợ **3 chế độ**: Light / Dark / System (tự động theo thiết bị).

**Theme Store** (file `src/store/slices/themeSlice.ts`):
- Lưu preference vào SecureStore (key: `app_theme_mode`)
- Khi mode = `system`: lắng nghe `Appearance.addChangeListener()` để tự động đổi

**Color palette:**
- Light: nền trắng, text `#111827`, primary PTIT Red `#B3261E`
- Dark: nền `#111827`, text sáng, primary `#E53935`

Mọi screen đều dùng hook `useTheme()` để lấy colors hiện tại, không hardcode màu.

---

### Q14: Dự án có những hạn chế gì? Hướng phát triển?

**Trả lời:**

**Hạn chế hiện tại:**
1. Feed chỉ chronological, chưa có recommendation algorithm
2. Chưa có full-text search (dùng LIKE query, chậm với dataset lớn)
3. Pagination offset-based (chậm khi offset lớn, nên chuyển cursor-based)
4. Socket.io chưa có authentication middleware (chỉ dùng userId join room, chưa verify JWT)
5. CORS đang mở `origin: '*'` (cần restrict cho production)
6. Chưa có image CDN (client truy cập trực tiếp MinIO)

**Hướng phát triển:**
1. Thêm algorithmic feed (weighted by engagement, recency, following)
2. Implement full-text search với PostgreSQL tsvector hoặc Elasticsearch
3. Thêm Group Chat (đã có model ConversationType.GROUP nhưng chưa implement đầy đủ)
4. Video/voice call (WebRTC)
5. Story/Reel feature
6. Admin dashboard để quản lý users, posts, reports
7. CDN cho static assets (CloudFront hoặc Cloudflare)
8. Horizontal scaling: tách Socket.io server riêng với Redis adapter

---

## 5. Ghi Chú Phối Hợp

- **Database schema** (`backend/prisma/schema.prisma`) là file chung -> phối hợp khi thay đổi
- **Middleware** (`backend/src/middleware/`) dùng chung -> Người 1 phụ trách chính
- **Shared utils** (`backend/src/shared/`) dùng chung -> thống nhất trước khi sửa
- **Theme & Design** (`src/constants/theme.ts`) thống nhất PTIT Red (`#B3261E`)
- **API Client** (`src/services/api/apiClient.ts`) dùng chung -> Người 1 setup
- **Socket Service** (`src/services/socket/socketService.ts`) -> Người 2 phụ trách
- Presenter cần phối hợp với cả 2 để hiểu rõ tính năng trước khi thuyết trình
- Git workflow: Mỗi người làm trên branch riêng, merge vào `main` qua Pull Request

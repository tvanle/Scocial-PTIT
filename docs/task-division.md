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

## 1. Cấu trúc Slide đề xuất

### Slide 1-2: Giới thiệu
- Tên dự án: **PTIT Social** - Mạng xã hội dành cho sinh viên PTIT
- Nhóm thực hiện: [Tên thành viên]
- Giảng viên hướng dẫn: [Tên GV]

### Slide 3-4: Bài toán & Mục tiêu
- Nhu cầu kết nối sinh viên PTIT
- Mục tiêu: Xây dựng mạng xã hội với đầy đủ tính năng (đăng bài, chat, follow, notification)
- Đối tượng: Sinh viên Học viện CNBCVT

### Slide 5-7: Công nghệ sử dụng
- Frontend: React Native + Expo 54 + TypeScript
- Backend: Express.js + TypeScript + Prisma ORM
- Database: PostgreSQL
- Cache: Redis
- Real-time: Socket.io
- Storage: MinIO (S3-compatible)
- Auth: JWT + 2FA (TOTP)
- Push: Firebase Cloud Messaging

### Slide 8-10: Kiến trúc hệ thống
- Sơ đồ System Architecture
- Monorepo structure
- API request flow: Mobile -> Express -> Prisma -> PostgreSQL
- Real-time flow: Mobile <-> Socket.io <-> Express

### Slide 11-12: Database Design
- ERD diagram (21 bảng chính)
- Quan hệ chính: User -> Post -> Comment -> Like/Share
- Conversation -> Message -> MessageReadStatus

### Slide 13-15: Tính năng chính
- Authentication: Register, Login, Email OTP, 2FA
- Social: Post, Like, Comment, Share, Poll, Feed
- Messaging: Real-time chat, Voice messages, Online status
- Notification: Push notification, In-app notification

### Slide 16-18: Demo
- Live demo hoặc video quay sẵn
- Theo các luồng chính (xem mục Demo bên dưới)

### Slide 19-20: Kết luận
- Kết quả đạt được
- Hạn chế
- Hướng phát triển

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

### Demo 1: Đăng ký & Xác thực (2 phút)
1. Mở app -> RegisterScreen
2. Nhập email, password, studentId
3. Hiển thị VerifyEmailScreen
4. Nhập OTP 6 số
5. Chuyển đến HomeScreen

### Demo 2: Tạo bài viết & Tương tác (3 phút)
1. Nhấn FAB "+" -> CreatePostScreen
2. Nhập nội dung, đính kèm ảnh, tạo poll
3. Đăng bài -> Hiển thị trên Feed
4. Like bài viết (animation heart)
5. Vote poll -> hiển thị kết quả %
6. Comment bài viết, reply comment

### Demo 3: Chat Real-time (3 phút)
1. Vào ChatListScreen -> hiển thị conversations
2. Mở ChatRoomScreen với user khác
3. Gửi tin nhắn text -> hiện real-time
4. Gửi voice message
5. Share bài viết vào chat
6. Typing indicator (3 dots animation)
7. Online status (green dot)

### Demo 4: Notification & Follow (2 phút)
1. Follow user -> tạo notification
2. Vào NotificationScreen -> hiển thị grouped by date
3. Filter theo type (Likes, Comments, Follows)
4. Nhấn notification -> navigate đến bài viết/profile

### Demo 5: Profile & Search (2 phút)
1. ProfileScreen: cover, avatar, stats, posts
2. EditProfileScreen: đổi avatar, bio
3. SearchScreen: tìm user, xem history
4. UserProfileScreen: follow/unfollow, nhắn tin

---

## 4. Chuẩn bị Q&A

### Câu hỏi thường gặp & Gợi ý trả lời

**Q: Tại sao chọn monorepo thay vì microservices?**
> A: Dự án có quy mô vừa, team nhỏ (2-3 người). Monorepo giúp chia sẻ types/interfaces giữa frontend-backend, đơn giản hóa deployment, và dễ debug. Microservices phù hợp khi cần scale từng service độc lập, nhưng tăng complexity không cần thiết cho dự án này.

**Q: Cơ chế Refresh Token hoạt động như thế nào?**
> A: Access token có thời hạn ngắn (15-30 phút). Khi hết hạn, client gửi refresh token (30 ngày) để lấy cặp token mới. Refresh token được lưu trong DB, mỗi lần dùng sẽ xóa cũ và tạo mới (rotation). Đổi password sẽ xóa tất cả refresh tokens (force logout all devices).

**Q: Socket.io xử lý khi user offline ra sao?**
> A: Tin nhắn vẫn được lưu vào DB qua HTTP API. Khi user online lại, app fetch messages qua GET API (phân trang). Socket.io chỉ phục vụ real-time delivery, không phải message persistence. Online status dựa trên lastActiveAt (5 phút threshold).

**Q: Prisma ORM có ưu/nhược điểm gì?**
> A: Ưu: Type-safe queries (TypeScript), auto-generate types từ schema, migration management, readable query syntax. Nhược: Không hỗ trợ complex raw queries tốt, performance overhead nhỏ so với raw SQL, learning curve cho advanced features.

**Q: Bảo mật API được xử lý ra sao?**
> A: JWT Bearer token cho mọi protected route, rate limiting (1000 req/15min/IP), Zod validation cho input, bcrypt hash password (salt: 12), 2FA TOTP support, CORS configuration, refresh token rotation, force logout all devices khi đổi password.

**Q: Tại sao dùng MinIO thay vì lưu file local?**
> A: MinIO tương thích S3 API, dễ migrate sang AWS S3 khi production. Hỗ trợ CDN, access control, versioning. Local storage không scale được, không có redundancy, khó backup.

**Q: Hệ thống notification hoạt động như thế nào?**
> A: Backend tự động tạo Notification record khi có event (like, comment, follow). Push notification qua Firebase Cloud Messaging (FCM) gửi đến device token đã đăng ký. Frontend có filter theo type, grouped by date, mark read/unread.

**Q: Xử lý upload file lớn như thế nào?**
> A: Image tự động resize (max 1920px) và compress JPEG 85% bằng Sharp. Avatar resize 512x512. Video/audio lưu nguyên. Upload qua multipart form-data, memory storage, max 10 files/request. MinIO xử lý storage với bucket policy.

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

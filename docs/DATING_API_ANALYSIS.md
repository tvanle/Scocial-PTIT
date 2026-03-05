# Phân tích API Dating – PTIT Social

Tài liệu mô tả toàn bộ API thuộc module **Dating**, luồng xử lý và ràng buộc dữ liệu.

---

## 1. Tổng quan cấu trúc

Base path: **`/api/v1/dating`**. Tất cả route đều **bắt buộc đăng nhập** (Bearer token).

| Submodule   | Base path              | Mục đích                          |
|------------|------------------------|------------------------------------|
| Profile    | `/api/v1/dating/profile`   | Hồ sơ dating, ảnh, prompts, lifestyle, preferences |
| Discovery  | `/api/v1/dating/discovery` | Danh sách gợi ý để swipe          |
| Swipe      | `/api/v1/dating/swipe`     | Like / Pass và tạo match          |
| Matches    | `/api/v1/dating/matches`   | Danh sách và chi tiết match       |

---

## 2. Profile APIs

**Route:** `/api/v1/dating/profile` (và con).

### 2.1. Tạo hồ sơ – `POST /api/v1/dating/profile`

- **Body:** `{ "bio": string }` — 10–500 ký tự.
- **Logic:**
  - Kiểm tra user ≥ 18 tuổi (theo `User.dateOfBirth`).
  - Chỉ cho tạo 1 profile/user (đã có → 409 Conflict).
  - Tạo `DatingProfile` + **DatingPreferences** mặc định: `ageMin: 18`, `ageMax: 99`.
- **Response:** Profile vừa tạo (id, userId, bio, isActive, createdAt, updatedAt).

### 2.2. Cập nhật hồ sơ – `PUT /api/v1/dating/profile`

- **Body:** `{ "bio"?: string, "isActive"?: boolean }` — cả hai optional.
- **Logic:** Cập nhật profile của user đang đăng nhập. Profile phải tồn tại.
- **Response:** Profile sau khi cập nhật.

### 2.3. Lấy hồ sơ của mình – `GET /api/v1/dating/profile/me`

- **Logic:** Trả về profile đầy đủ của user hiện tại (profile + photos, prompts, lifestyle, preferences, user).
- **Response:** Object profile kèm relations.

### 2.4. Xem hồ sơ người khác – `GET /api/v1/dating/profile/:userId`

- **Params:** `userId` (UUID).
- **Logic:**
  - Nếu `userId` = user hiện tại → trả về giống `GET /me`.
  - Kiểm tra block (chặn) hai chiều: không xem được nếu một trong hai đã chặn nhau.
  - Chỉ trả về profile **isActive**, kèm photos, prompts, lifestyle, thông tin user (fullName, avatar, dateOfBirth, gender).
- **Response:** Profile công khai của user đó (không trả preferences).

### 2.5. Thêm ảnh – `POST /api/v1/dating/profile/photos`

- **Body:** `{ "url": string (URL), "order"?: number }` — order 0–5, tối đa 6 ảnh/profile.
- **Logic:** Validate profile tồn tại, kiểm tra số ảnh < 6, không trùng `order` (nếu có). Tạo `DatingProfilePhoto`.
- **Response:** Ảnh vừa thêm (id, url, order, createdAt).

### 2.6. Xóa ảnh – `DELETE /api/v1/dating/profile/photos/:id`

- **Params:** `id` (UUID của ảnh).
- **Logic:** Ảnh phải thuộc profile của user hiện tại. Sau xóa vẫn phải còn ít nhất 1 ảnh (nếu không sẽ lỗi).
- **Response:** Thành công (body có thể null).

### 2.7. Cập nhật prompts – `PUT /api/v1/dating/profile/prompts`

- **Body:** `{ "prompts"?: Array<{ question: string, answer: string }> }` — tối đa 3 cặp, question ≤ 200 ký tự, answer ≤ 500.
- **Logic:** Xóa toàn bộ prompt cũ, tạo mới theo mảng gửi lên (replace).
- **Response:** Danh sách prompts sau khi cập nhật.

### 2.8. Cập nhật lifestyle – `PUT /api/v1/dating/profile/lifestyle`

- **Body:** Tất cả optional:
  - `education`, `job`, `religion`: string (giới hạn length trong schema).
  - `smoking`, `drinking`, `exercise`: `'NEVER' | 'SOMETIMES' | 'REGULARLY'`.
  - `height`: number 100–250 (cm).
- **Logic:** Upsert một bản ghi `DatingProfileLifestyle` cho profile của user.
- **Response:** Object lifestyle sau khi lưu.

### 2.9. Cập nhật preferences – `PUT /api/v1/dating/profile/preferences`

- **Body:** 
  - Bắt buộc: `ageMin`, `ageMax` (18–99), và **ageMin ≤ ageMax**.
  - Optional: `maxDistance` (1–500 km), `gender` (`'MALE' | 'FEMALE' | 'OTHER'`).
- **Logic:** Upsert `DatingPreferences` cho profile. Dùng để lọc Discovery (tuổi, giới tính).
- **Response:** Object preferences sau khi lưu.

---

## 3. Discovery API

### 3.1. Lấy danh sách gợi ý – `GET /api/v1/dating/discovery`

- **Query:** `page`, `limit` (optional, dạng string số).
- **Logic:**
  1. User phải có dating profile, nếu không → 404.
  2. Lấy preferences (gender, ageMin, ageMax) của user hiện tại.
  3. Lấy danh sách user đã swipe (fromUserId = me) → loại khỏi discovery.
  4. Điều kiện profile:
     - Không phải chính mình, không nằm trong danh sách đã swipe.
     - `isActive: true`.
     - Có ít nhất 1 ảnh (`photos: { some: {} }`).
  5. Lọc User theo preferences:
     - **Giới tính:** nếu preferences có `gender` thì chỉ lấy user có `gender` trùng.
     - **Tuổi:** tính từ `dateOfBirth`, chỉ lấy user có tuổi trong [ageMin, ageMax].
  6. Phân trang: `skip`/`take` từ `page`/`limit`, sort `createdAt` desc.
- **Response:** Dạng phân trang `{ data: [...], total, page, limit, totalPages }`. Mỗi phần tử là **card** (userId, bio, 1 ảnh đầu, user: id, fullName, avatar, dateOfBirth, gender). Chi tiết đầy đủ xem qua `GET /dating/profile/:userId`.

---

## 4. Swipe API

### 4.1. Swipe – `POST /api/v1/dating/swipe`

- **Body:** `{ "targetUserId": string (UUID), "action": "LIKE" | "PASS" }`.
- **Logic:**
  1. **Không cho swipe chính mình** → 400.
  2. **Không swipe trùng:** cặp (fromUserId, toUserId) đã tồn tại → 409.
  3. User hiện tại phải có **dating profile isActive** → không thì 404.
  4. **Target** phải có dating profile **isActive** → không thì 404.
  5. **Block:** nếu hai user đã chặn nhau (bất kể ai chặn ai) → 403.
  6. **PASS:** chỉ tạo bản ghi `DatingSwipe` (action PASS), trả về `{ swipe, matched: false, match: null }`.
  7. **LIKE:**
     - Tạo swipe LIKE.
     - Kiểm tra **reciprocal like:** target đã like mình chưa (swipe từ target → me, action LIKE).
     - Nếu có → tạo **DatingMatch** (userAId, userBId cố định thứ tự để tránh trùng), trong cùng transaction:
       - Tạo **Conversation** PRIVATE và **ConversationParticipant** cho 2 user.
       - Tạo **Notification** MATCH_CREATED cho cả hai.
     - Nếu match đã tồn tại (race, P2002) thì chỉ đọc lại match, không tạo conversation/notification lần 2.
- **Response:**  
  - PASS: `{ swipe, matched: false, match: null }`.  
  - LIKE không đối phương like lại: `{ swipe, matched: false, match: null }`.  
  - LIKE và đã match: `{ swipe, matched: true, match }` (kèm message “Bạn có một kết nối mới!”).

---

## 5. Matches APIs

### 5.1. Danh sách match – `GET /api/v1/dating/matches`

- **Query:** `page`, `limit` (optional).
- **Logic:** Lấy tất cả `DatingMatch` mà user hiện tại là userA hoặc userB. Sort `createdAt` desc, phân trang. Với mỗi match, map thành object có `id`, `matchedUser` (user còn lại), `createdAt`.
- **Response:** Phân trang `{ data, total, page, limit, totalPages }`, mỗi item: `{ id, matchedUser, createdAt }`.

### 5.2. Chi tiết một match – `GET /api/v1/dating/matches/:id`

- **Params:** `id` (UUID của match).
- **Logic:** Chỉ trả về nếu user hiện tại là userA hoặc userB; nếu không thuộc match → 403. Match không tồn tại → 404.
- **Response:** `{ id, matchedUser, createdAt }`.

---

## 6. Luồng nghiệp vụ (user flow)

1. **Đăng ký / Login** (Auth) → có JWT.
2. **Tạo dating profile:** `POST /dating/profile` với `bio` (user phải ≥ 18, chỉ 1 profile/user).
3. **Bổ sung hồ sơ:**  
   - Thêm ảnh: `POST /dating/profile/photos` (cần ít nhất 1 ảnh để xuất hiện discovery).  
   - Prompts, lifestyle, preferences: các `PUT` tương ứng.
4. **Discovery:** `GET /dating/discovery` → danh sách card gợi ý (đã lọc theo đã swipe, preferences, active, có ảnh).
5. **Swipe:** `POST /dating/swipe` với `targetUserId` và `action: LIKE` hoặc `PASS`. Like hai chiều → tạo match + conversation + notification.
6. **Xem match:** `GET /dating/matches` (danh sách), `GET /dating/matches/:id` (chi tiết). Từ đó có thể vào conversation (Chat module) để nhắn tin.

---

## 7. Lưu ý bảo mật & ràng buộc

- **Profile:** Mọi route profile đều xác thực user; chỉ sửa/xem profile của mình hoặc profile công khai (không preferences) của người khác; có kiểm tra block khi xem profile người khác.
- **Discovery:** Chỉ trả về user có profile isActive và có ảnh; loại đã swipe và tự loại bản thân; lọc theo preferences (giới tính, tuổi).
- **Swipe:** Chặn swipe chính mình, swipe trùng, profile không active, và user bị chặn; match tạo trong transaction (swipe + match + conversation + notification).
- **Matches:** Chỉ cho xem match mà user tham gia; không lộ match của người khác.

---

## 8. Bảng tóm tắt route

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| POST   | `/api/v1/dating/profile` | Tạo profile (bio, ≥18, 1/user) |
| PUT    | `/api/v1/dating/profile` | Cập nhật bio / isActive |
| GET    | `/api/v1/dating/profile/me` | Lấy profile của mình |
| GET    | `/api/v1/dating/profile/:userId` | Xem profile người khác (có block check) |
| POST   | `/api/v1/dating/profile/photos` | Thêm ảnh (url, order; max 6) |
| DELETE | `/api/v1/dating/profile/photos/:id` | Xóa ảnh (còn ≥ 1 ảnh) |
| PUT    | `/api/v1/dating/profile/prompts` | Thay thế prompts (tối đa 3) |
| PUT    | `/api/v1/dating/profile/lifestyle` | Upsert lifestyle |
| PUT    | `/api/v1/dating/profile/preferences` | Upsert preferences (ageMin/Max bắt buộc) |
| GET    | `/api/v1/dating/discovery` | Danh sách gợi ý (page, limit) |
| POST   | `/api/v1/dating/swipe` | Like / Pass → có thể tạo match |
| GET    | `/api/v1/dating/matches` | Danh sách match (page, limit) |
| GET    | `/api/v1/dating/matches/:id` | Chi tiết một match |

Tất cả đều dùng **Bearer token** (trừ các API auth khác của dự án).

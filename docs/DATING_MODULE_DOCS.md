# PTIT Social - Dating Module Documentation

> Tài liệu kỹ thuật chi tiết về module Dating trong ứng dụng PTIT Social
>
> Ngày tạo: 2026-04-23

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Luồng người dùng (User Flows)](#3-luồng-người-dùng)
4. [Database Design](#4-database-design)
5. [Discovery & Scoring Algorithm](#5-discovery--scoring-algorithm)
6. [Swipe & Matching System](#6-swipe--matching-system)
7. [Location-based Features](#7-location-based-features)
8. [Chat System](#8-chat-system)
9. [Subscription & Payment](#9-subscription--payment)
10. [Security](#10-security)
11. [API Reference](#11-api-reference)

---

## 1. Tổng quan

### 1.1 Mục đích

Dating Module cho phép sinh viên PTIT tìm kiếm và kết nối với nhau thông qua cơ chế swipe (quẹt) tương tự Tinder. Module được thiết kế riêng biệt với phần Social chính để đảm bảo privacy và trải nghiệm người dùng tốt nhất.

### 1.2 Tính năng chính

| Tính năng | Mô tả | Tier |
|-----------|-------|------|
| Discovery | Xem và swipe các hồ sơ phù hợp | All |
| Matching | Khi cả 2 cùng like nhau sẽ match | All |
| Chat | Nhắn tin với người đã match | All |
| Super Like | Like đặc biệt, người kia sẽ biết bạn thích họ | FREE: 1/ngày, PREMIUM: 5/ngày |
| Rewind | Quay lại swipe trước đó | PREMIUM only |
| See Likes | Xem ai đã like mình (không bị blur) | PREMIUM only |
| Unlimited Swipes | Swipe không giới hạn | PREMIUM only |

### 1.3 Tech Stack

**Frontend:**
- React Native + Expo 54
- React Navigation v7 (navigation)
- React Query (data fetching & caching)
- Zustand (local state)
- Reanimated 3 + Gesture Handler (animations)

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Socket.io (real-time)
- Firebase Cloud Messaging (push notifications)

**Payment:**
- VNPay (card payment)
- VietQR (bank transfer QR)
- SePay (auto-confirm webhook)

---

## 2. Kiến trúc hệ thống

### 2.1 High-level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
├─────────────────────────────────────────────────────────────────┤
│  Screens    │  Services     │  State        │  Navigation       │
│  - Discovery│  - datingAPI  │  - React Query│  - DatingTab      │
│  - Chat     │  - chatAPI    │  - Zustand    │  - Stack screens  │
│  - Profile  │  - paymentAPI │               │                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API (Express)                        │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/dating                                                  │
│  ├── /profile      → Profile CRUD, photos, prompts              │
│  ├── /discovery    → Feed với scoring algorithm                 │
│  ├── /swipe        → Like/Unlike/SuperLike, Rewind              │
│  ├── /matches      → Danh sách matches                          │
│  ├── /location     → GPS update, nearby users                   │
│  ├── /chat         → Dating conversations & messages            │
│  └── /payment      → VNPay, VietQR, subscription                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  Dating tables: DatingProfile, DatingSwipe, DatingMatch,        │
│                 DatingSubscription, PaymentTransaction, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Tại sao tách riêng Dating Chat?

Dating chat được tách riêng khỏi Social chat vì:

1. **Privacy**: Conversation dating chỉ hiển thị trong tab Dating, không lẫn với chat bạn bè
2. **Context khác nhau**: Dating chat có các tính năng riêng (icebreakers, prompts reply)
3. **Permission khác**: Chỉ có thể chat khi đã match (khác với social chat có thể message anyone)

**Cách phân biệt trong database:**
```
Conversation.context = 'SOCIAL' | 'DATING'
```

Khi query conversations, filter theo context để tách biệt 2 loại chat.

---

## 3. Luồng người dùng

### 3.1 Onboarding Flow (Tạo hồ sơ Dating lần đầu)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Splash     │───▶│ Profile Setup│───▶│ Preferences  │───▶│  Location    │
│   Screen     │    │   (Step 2)   │    │   (Step 3)   │    │  Permission  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                   │                    │
                           ▼                   ▼                    ▼
                    - Upload 2+ photos   - Giới tính muốn xem  - Cho phép GPS
                    - Viết bio (10+ ký tự)- Khoảng cách max    - Update location
                    - Chọn sở thích      - Khoảng tuổi
                    - Thêm prompts (opt) - Ngành học ưa thích
```

**Validation rules:**
- Photos: Tối thiểu 2 ảnh, tối đa 6 ảnh
- Bio: Tối thiểu 10 ký tự, tối đa 500 ký tự
- Prompts: Tối đa 3 prompts
- Songs: Tối đa 3 bài (SoundCloud embed)

### 3.2 Discovery Flow (Swipe)

```
User mở Discovery Screen
         │
         ▼
┌─────────────────────────────────────────┐
│  API: GET /dating/discovery             │
│  Backend thực hiện:                     │
│  1. Lấy preferences của user            │
│  2. Lấy danh sách đã swipe + blocked    │
│  3. Query candidates từ DB              │
│  4. Scoring algorithm (xếp hạng)        │
│  5. Tính khoảng cách (Haversine)        │
│  6. Trả về danh sách đã sort            │
└─────────────────────────────────────────┘
         │
         ▼
User thấy stack of cards
         │
         ├── Swipe LEFT ──▶ API: POST /swipe {action: 'UNLIKE'}
         │                        → Ghi nhận, không match
         │
         ├── Swipe RIGHT ─▶ API: POST /swipe {action: 'LIKE'}
         │                        → Check có reciprocal like?
         │                        → Nếu có: TẠO MATCH 🎉
         │                        → Nếu không: Ghi nhận, chờ
         │
         └── Tap SUPER LIKE ▶ API: POST /swipe {action: 'SUPER_LIKE'}
                                  → Như LIKE + gửi notification cho người kia
```

### 3.3 Match Flow

```
User A likes User B
         │
         ▼
Check: User B đã like User A chưa?
         │
         ├── CHƯA: Ghi swipe, kết thúc
         │
         └── RỒI: ────────────────────────────────────────┐
                                                          │
         ┌────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│  Transaction (atomic):                  │
│  1. Create DatingMatch record           │
│  2. Create Conversation (context=DATING)│
│  3. Add both as participants            │
│  4. Create notifications for both       │
│  5. Send push notifications             │
└─────────────────────────────────────────┘
         │
         ▼
Cả 2 user thấy Match Success Screen
         │
         ▼
Có thể bắt đầu chat
```

**Tại sao dùng Transaction?**

Khi match xảy ra, cần tạo nhiều records cùng lúc (match + conversation + notifications). Nếu một bước fail, tất cả phải rollback để tránh data inconsistency.

### 3.4 Payment Flow

```
User chọn gói Premium
         │
         ├── VNPay ─────────────────────────────────────┐
         │   1. POST /payment/vnpay/create              │
         │   2. Redirect đến VNPay gateway              │
         │   3. User thanh toán                         │
         │   4. VNPay redirect về /vnpay/return         │
         │   5. Verify signature + update subscription  │
         │                                              │
         └── VietQR ────────────────────────────────────┤
             1. POST /payment/vietqr/create             │
             2. Hiển thị QR code trong app              │
             3. User scan và chuyển khoản              │
             4. SePay webhook gọi /sepay/webhook        │
             5. Match transaction code, upgrade sub     │
                                                        │
         ┌──────────────────────────────────────────────┘
         ▼
Subscription upgraded to PREMIUM
         │
         ▼
User có thể sử dụng các tính năng Premium
```

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
                    ┌─────────────┐
                    │    User     │
                    │   (main)    │
                    └──────┬──────┘
                           │ 1:1
                           ▼
┌───────────────────────────────────────────────────────────┐
│                     DatingProfile                          │
│  - id, userId (unique)                                    │
│  - bio, isActive                                          │
│  - latitude, longitude, locationUpdatedAt                 │
└───────────────────────────┬───────────────────────────────┘
          │                 │                 │
          │ 1:N             │ 1:N             │ 1:1
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐    ┌────────────────┐
   │   Photos   │    │  Prompts   │    │  Preferences   │
   │  (max 6)   │    │  (max 3)   │    │                │
   └────────────┘    └────────────┘    │ - ageMin/Max   │
          │                            │ - gender       │
          │ 1:N                        │ - maxDistance  │
          ▼                            │ - majors[]     │
   ┌────────────┐                      └────────────────┘
   │   Songs    │
   │  (max 3)   │
   └────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DatingSwipe                             │
│  - fromUserId, toUserId (unique pair)                       │
│  - action: LIKE | UNLIKE | SUPER_LIKE                       │
│  - createdAt                                                │
│                                                             │
│  Index: (fromUserId, toUserId, action) - for match check    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DatingMatch                             │
│  - userAId, userBId (unique pair, always sorted)            │
│  - createdAt                                                │
│                                                             │
│  Tại sao sort userA/userB?                                  │
│  → Đảm bảo uniqueness: A-B và B-A là cùng 1 match          │
│  → Luôn lưu userId nhỏ hơn vào userAId                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DatingSubscription                         │
│  - userId (unique)                                          │
│  - tier: FREE | PREMIUM                                     │
│  - status: ACTIVE | EXPIRED | CANCELLED                     │
│  - startDate, endDate                                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Conversation Design (Dating vs Social)

```
┌─────────────────────────────────────────────────────────────┐
│                      Conversation                            │
│  - context: SOCIAL | DATING  ← Phân biệt 2 loại chat       │
│  - participantAId, participantBId (sorted, for uniqueness)  │
│                                                             │
│  Unique constraint: (participantAId, participantBId, context)│
│  → Cho phép 2 user có CẢ social chat VÀ dating chat riêng  │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Daily Usage Tracking

```
┌─────────────────────────────────────────────────────────────┐
│                    DatingUsageDaily                          │
│  - userId + date (unique) ← 1 record per user per day       │
│  - swipeCount, superLikeCount, rewindCount                  │
│                                                             │
│  Tại sao track daily?                                       │
│  → FREE users có giới hạn: 50 swipes, 1 super like/ngày    │
│  → Reset mỗi ngày (dựa trên date field)                     │
│  → PREMIUM users: dailySwipes = -1 (unlimited)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Discovery & Scoring Algorithm

### 5.1 Vấn đề cần giải quyết

Khi user mở Discovery, hệ thống cần trả về danh sách profiles phù hợp nhất. Nhưng "phù hợp" là gì?

**Các yếu tố ảnh hưởng:**
1. Preferences của user (tuổi, giới tính, ngành học)
2. Khoảng cách địa lý
3. Profile completeness (profile đầy đủ hơn = đáng tin hơn)
4. Recent activity (người active gần đây = khả năng reply cao hơn)

### 5.2 Scoring System (100 điểm)

```
┌─────────────────────────────────────────────────────────────┐
│                    SCORING WEIGHTS                           │
├──────────────────────┬────────────────┬─────────────────────┤
│ Factor               │ Max Points     │ Giải thích          │
├──────────────────────┼────────────────┼─────────────────────┤
│ Age Match            │ 30             │ Tuổi trong range    │
│ Gender Match         │ 20             │ Đúng giới tính      │
│ Major Match          │ 20             │ Cùng ngành học      │
│ Same Year            │ 10             │ Cùng khóa (B21...)  │
│ Profile Completeness │ 10             │ Ảnh, bio, info      │
│ Recent Activity      │ 10             │ Online gần đây      │
├──────────────────────┼────────────────┼─────────────────────┤
│ TOTAL                │ 100            │                     │
└──────────────────────┴────────────────┴─────────────────────┘
```

### 5.3 Chi tiết từng Factor

**Age Match (30 điểm):**
```
User preference: ageMin = 20, ageMax = 25
Center = (20 + 25) / 2 = 22.5

Candidate tuổi 22: gần center → điểm cao (~28 điểm)
Candidate tuổi 25: xa center → điểm thấp hơn (~20 điểm)
Candidate tuổi 27: ngoài range → 0 điểm
```

**Tại sao không chỉ check in range?**
→ Người ở giữa range thường phù hợp hơn người ở biên

**Gender Match (20 điểm):**
```
Preference = FEMALE → Candidate FEMALE = 20 điểm
Preference = FEMALE → Candidate MALE = 0 điểm
Preference = null (tất cả) → Bất kỳ = 10 điểm (50%)
```

**Profile Completeness (10 điểm):**
```
┌─────────────────┬────────────┐
│ Component       │ Score      │
├─────────────────┼────────────┤
│ 3+ photos       │ +4 điểm    │
│ 1-2 photos      │ +2 điểm    │
│ Bio 20+ chars   │ +3 điểm    │
│ Bio < 20 chars  │ +1 điểm    │
│ Has education   │ +1.5 điểm  │
│ Has full name   │ +1.5 điểm  │
└─────────────────┴────────────┘
Max: 10 điểm
```

**Recent Activity (10 điểm):**
```
┌─────────────────────┬────────────┐
│ Last active         │ Score      │
├─────────────────────┼────────────┤
│ Within 1 hour       │ 10 điểm    │
│ Within 24 hours     │ 7 điểm     │
│ Within 3 days       │ 4 điểm     │
│ Within 1 week       │ 2 điểm     │
│ Over 1 week         │ 0 điểm     │
└─────────────────────┴────────────┘
```

### 5.4 Discovery Query Flow

```
Step 1: DB-level filtering (nhanh, index-based)
─────────────────────────────────────────────
WHERE isActive = true
  AND has_photos = true
  AND userId NOT IN (already_swiped + blocked)
  AND gender = preference.gender (if set)
  AND age BETWEEN preference.ageMin AND preference.ageMax

Step 2: Fetch pool (5x requested limit)
─────────────────────────────────────────────
Nếu user request 10 profiles, fetch 50 từ DB
→ Đủ data để scoring có ý nghĩa

Step 3: Score each candidate
─────────────────────────────────────────────
For each candidate:
  score = ageMatch + genderMatch + majorMatch
        + sameYear + completeness + activity

Step 4: Sort by score DESC
─────────────────────────────────────────────

Step 5: Paginate
─────────────────────────────────────────────
Return top N theo page/limit

Step 6: Calculate distance
─────────────────────────────────────────────
For each in result:
  distance = Haversine(myLat, myLng, theirLat, theirLng)
```

### 5.5 Tại sao không filter khoảng cách trong DB?

**Vấn đề:** PostgreSQL không có native support cho geo queries (không như MongoDB với $geoNear)

**Giải pháp cho findNearbyUsers:**
```sql
-- Bounding box pre-filter (fast, uses index)
WHERE latitude BETWEEN (myLat - delta) AND (myLat + delta)
  AND longitude BETWEEN (myLng - delta) AND (myLng + delta)

-- Exact Haversine in SELECT (calculated per row)
SELECT *, (6371 * acos(...)) AS distance
FROM nearby
WHERE distance <= maxDistance
```

**Nhưng trong Discovery:**
- Không bắt buộc filter theo distance
- Scoring quan trọng hơn distance
- Distance chỉ để display, không để filter

---

## 6. Swipe & Matching System

### 6.1 Swipe Actions

| Action | Ý nghĩa | Check match? | Limit (FREE) |
|--------|---------|--------------|--------------|
| LIKE | Thích người này | Có | 50/ngày |
| UNLIKE | Không thích | Không | 50/ngày |
| SUPER_LIKE | Thích + notify | Có | 1/ngày |

### 6.2 Match Detection Logic

```
User A LIKE User B
         │
         ▼
Query: EXISTS swipe WHERE
       fromUserId = B AND
       toUserId = A AND
       action IN ('LIKE', 'SUPER_LIKE')
         │
         ├── FALSE: Ghi swipe, return {matched: false}
         │
         └── TRUE: ─────────────────────────┐
                                            │
┌───────────────────────────────────────────┘
▼
Transaction {
  1. Upsert swipe record
  2. Create match (handle race condition with unique constraint)
  3. Create conversation
  4. Create notifications
}
```

**Race Condition Handling:**

Nếu A like B và B like A gần như cùng lúc:
```
Thread 1: A likes B → check B liked A? YES → create match
Thread 2: B likes A → check A liked B? YES → create match (DUPLICATE!)
```

**Solution:**
```typescript
try {
  await tx.datingMatch.create({ data: { userAId, userBId } });
} catch (error) {
  if (error.code === 'P2002') { // Unique constraint violation
    // Match already exists, just return it
    const existing = await tx.datingMatch.findUnique({...});
    return { matched: true, match: existing };
  }
  throw error;
}
```

### 6.3 Rewind (Premium)

```
User bấm Rewind
         │
         ▼
Check: isPremium? canRewind? ────▶ FALSE: Return error
         │
         │ TRUE
         ▼
Get last swipe (within 5 minutes)
         │
         ▼
Delete swipe record
         │
         ▼
If was LIKE/SUPER_LIKE that created match:
  → Delete match record too
         │
         ▼
Return rewound profile (để hiện lại trong stack)
```

**Tại sao giới hạn 5 phút?**
- Tránh abuse: rewind swipe từ tuần trước
- UX: chỉ rewind khi "swipe nhầm" ngay lập tức

### 6.4 Incoming Likes (Blurred for FREE)

```
FREE User:                      PREMIUM User:
┌─────────────┐                ┌─────────────┐
│ [BLURRED]   │                │ [CLEAR]     │
│ ???         │                │ Nguyễn Văn A│
│ Tap để xem  │                │ 22 tuổi     │
└─────────────┘                └─────────────┘

API response cho FREE user:
{
  user: { fullName: "???", avatar: "..." },
  photos: [{ url: "...", blurred: true }],
  bio: null,
  isBlurred: true
}
```

**Tại sao blur?**
- Monetization: incentive upgrade to Premium
- Tinder cũng làm vậy

---

## 7. Location-based Features

### 7.1 Cập nhật vị trí

```
App request location permission
         │
         ▼
Expo Location.getCurrentPositionAsync()
         │
         ▼
POST /dating/location
{
  latitude: 21.0285,
  longitude: 105.8542
}
         │
         ▼
Update DatingProfile.latitude, longitude, locationUpdatedAt
```

**Khi nào cập nhật?**
- Lần đầu vào Dating
- Mỗi khi mở Discovery screen (background)
- Không cập nhật liên tục để tiết kiệm battery

### 7.2 Haversine Formula

Tính khoảng cách giữa 2 điểm trên bề mặt Trái Đất:

```
d = R × arccos(
    cos(lat1) × cos(lat2) × cos(lng2 - lng1)
    + sin(lat1) × sin(lat2)
)

Với R = 6371 km (bán kính Trái Đất)
```

**Ví dụ:**
```
Hà Nội: (21.0285, 105.8542)
Hải Phòng: (20.8449, 106.6881)

Distance ≈ 100 km
```

### 7.3 Bounding Box Optimization

**Vấn đề:** Tính Haversine cho 10,000 users rất chậm

**Giải pháp:** Pre-filter bằng bounding box

```
Muốn tìm users trong 50km:
- 1 độ latitude ≈ 111 km
- latDelta = 50 / 111 = 0.45 độ

WHERE latitude BETWEEN (myLat - 0.45) AND (myLat + 0.45)
  AND longitude BETWEEN (myLng - 0.45/cos(myLat)) AND (myLng + 0.45/cos(myLat))
```

→ Filter từ 10,000 xuống ~100 users
→ Rồi mới tính Haversine chính xác cho 100 users đó

---

## 8. Chat System

### 8.1 Dating Chat vs Social Chat

| Aspect | Social Chat | Dating Chat |
|--------|-------------|-------------|
| context | SOCIAL | DATING |
| Permission | Anyone | Only matched users |
| Hiển thị | Chat tab chính | Dating tab |
| Features | Share post, media | Prompts reply, icebreakers |

### 8.2 Chat Flow

```
Match created
     │
     ▼
Conversation auto-created (trong match transaction)
     │
     ▼
User A mở chat
     │
     ▼
GET /dating/chat/conversations/:id/messages
     │
     ▼
Empty → Show icebreakers / prompts
     │
     ▼
User tap prompt → Prefill message
     │
     ▼
POST /dating/chat/conversations/:id/messages
{
  content: '{"type":"prompt_reply","prompt":"Điều bất ngờ về tôi là...","reply":"Tôi biết chơi piano"}'
}
     │
     ▼
Socket.emit('newMessage') to all participants
     │
     ▼
Send push notification (async)
```

### 8.3 Message Types

**Regular message:**
```json
{
  "content": "Chào bạn!"
}
```

**Prompt reply:**
```json
{
  "content": "{\"type\":\"prompt_reply\",\"prompt\":\"Điều bất ngờ về tôi là...\",\"reply\":\"Tôi biết chơi piano\"}"
}
```

Frontend parse JSON để render đẹp hơn (card với prompt + reply)

### 8.4 Online Status

```typescript
function isUserOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - lastActiveAt.getTime() < 5 * 60 * 1000; // 5 minutes
}
```

**Cập nhật lastActiveAt khi:**
- User gửi message
- User mở conversation
- Không polling liên tục (tốn resource)

---

## 9. Subscription & Payment

### 9.1 Tier Limits

```
┌─────────────────────────────────────────────────────────────┐
│                         FREE                                 │
├─────────────────────────────────────────────────────────────┤
│ Daily Swipes:      50                                       │
│ Daily Super Likes: 1                                        │
│ Rewind:            ❌ Không có                              │
│ See Likes:         ❌ Bị blur                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        PREMIUM                               │
├─────────────────────────────────────────────────────────────┤
│ Daily Swipes:      ∞ Unlimited                              │
│ Daily Super Likes: 5                                        │
│ Rewind:            ✅ Unlimited                             │
│ See Likes:         ✅ Clear photos                          │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Pricing Plans

| Plan | Price (Test) | Price (Prod) | Duration | Savings |
|------|--------------|--------------|----------|---------|
| Monthly | 2,000đ | 99,000đ | 30 days | - |
| Quarterly | 5,000đ | 249,000đ | 90 days | 16% |
| Yearly | 10,000đ | 799,000đ | 365 days | 33% |

### 9.3 VNPay Integration

```
┌─────────────────────────────────────────────────────────────┐
│                      VNPay Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. App gọi POST /payment/vnpay/create                      │
│     → Backend tạo PaymentTransaction (PENDING)              │
│     → Backend generate VNPay URL với signature              │
│     → Return paymentUrl                                     │
│                                                             │
│  2. App mở WebView đến paymentUrl                           │
│     → User nhập thông tin thẻ                               │
│     → VNPay xử lý                                           │
│                                                             │
│  3. VNPay redirect về vnp_ReturnUrl                         │
│     → Backend verify signature (HMAC-SHA512)                │
│     → Check vnp_ResponseCode == '00' (success)              │
│     → Update transaction status                             │
│     → Upgrade subscription                                  │
│                                                             │
│  4. Redirect về app với deep link                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Signature verification:**
```
1. Nhận params từ VNPay (bao gồm vnp_SecureHash)
2. Remove vnp_SecureHash khỏi params
3. Sort params alphabetically
4. Join thành query string
5. HMAC-SHA512 với secret key
6. Compare với vnp_SecureHash
```

### 9.4 VietQR Integration

```
┌─────────────────────────────────────────────────────────────┐
│                      VietQR Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. App gọi POST /payment/vietqr/create                     │
│     → Backend tạo transaction với unique code               │
│     → Generate QR URL: img.vietqr.io/image/MB-xxx.png       │
│     → Return qrData                                         │
│                                                             │
│  2. App hiển thị QR code                                    │
│     → User mở app ngân hàng                                 │
│     → Scan QR và chuyển khoản                               │
│     → Nội dung: "PTIT Premium PTIT17xxxxx"                  │
│                                                             │
│  3. SePay detect transaction                                │
│     → Gọi webhook POST /payment/sepay/webhook               │
│     → Backend match transaction code trong content          │
│     → Verify amount                                         │
│     → Update status & upgrade subscription                  │
│                                                             │
│  4. App polling hoặc realtime notification                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.5 Subscription Extension

```
User đã Premium, mua thêm 3 tháng:

Current endDate: 2026-06-01
New plan: QUARTERLY (90 days)

New endDate = 2026-06-01 + 90 = 2026-08-30

→ Extend từ endDate hiện tại, không phải từ hôm nay
```

---

## 10. Security

### 10.1 Authentication

Tất cả Dating endpoints yêu cầu JWT token:

```
Authorization: Bearer <token>
```

Middleware `authenticate` verify token và attach `req.user.userId`

### 10.2 Block System

```
User A block User B
         │
         ▼
Insert UserBlock { blockerId: A, blockedUserId: B }
         │
         ▼
Effects:
- B không xuất hiện trong A's discovery
- A không xuất hiện trong B's discovery
- B không thể xem profile A
- A không thể xem profile B
- Existing match/conversation vẫn giữ nhưng không thể message
```

**Query pattern:**
```sql
WHERE userId NOT IN (
  SELECT blockedUserId FROM UserBlock WHERE blockerId = :me
  UNION
  SELECT blockerId FROM UserBlock WHERE blockedUserId = :me
)
```

### 10.3 Rate Limiting

**Application-level (subscription):**
```typescript
const usage = await subscriptionService.getDailyUsage(userId);

if (!usage.canSwipe) {
  throw new AppError('Hết lượt swipe', 403);
}
```

**Global rate limit:** 1000 requests / 15 minutes / IP

### 10.4 Input Validation

Sử dụng Zod cho type-safe validation:

```typescript
const swipeSchema = z.object({
  targetUserId: z.string().uuid(),
  action: z.enum(['LIKE', 'UNLIKE', 'SUPER_LIKE']),
});

// Middleware
validateBody(swipeSchema)
```

### 10.5 Sensitive Data

**Incoming likes cho FREE users:**
- fullName → "???"
- bio → null
- photos → blurred: true
- prompts → []

**Location:**
- Chỉ lưu lat/lng, không lưu địa chỉ cụ thể
- Chỉ hiện khoảng cách, không hiện vị trí chính xác

---

## 11. API Reference

### 11.1 Profile Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dating/profile` | POST | Tạo dating profile |
| `/dating/profile` | PUT | Cập nhật bio, isActive |
| `/dating/profile` | DELETE | Xóa profile |
| `/dating/profile/me` | GET | Lấy profile của mình |
| `/dating/profile/:userId` | GET | Xem profile người khác |
| `/dating/profile/photos` | POST | Thêm ảnh |
| `/dating/profile/photos` | PUT | Replace ảnh tại order |
| `/dating/profile/photos/:id` | DELETE | Xóa ảnh |
| `/dating/profile/prompts` | PUT | Cập nhật prompts |
| `/dating/profile/preferences` | PUT | Cập nhật preferences |

### 11.2 Discovery & Swipe Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dating/discovery` | GET | Lấy feed candidates |
| `/dating/swipe` | POST | Swipe action |
| `/dating/swipe/rewind` | POST | Undo last swipe |
| `/dating/swipe/likes/incoming` | GET | Ai đã like mình |
| `/dating/swipe/likes/sent` | GET | Mình đã like ai |

### 11.3 Match & Chat Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dating/matches` | GET | Danh sách matches |
| `/dating/chat/conversations` | GET | Danh sách conversations |
| `/dating/chat/conversations` | POST | Tạo/get conversation |
| `/dating/chat/conversations/:id/messages` | GET | Lấy messages |
| `/dating/chat/conversations/:id/messages` | POST | Gửi message |

### 11.4 Payment Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dating/payment/subscription` | GET | Subscription info + usage |
| `/dating/payment/plans` | GET | Pricing plans |
| `/dating/payment/vnpay/create` | POST | Tạo VNPay payment |
| `/dating/payment/vietqr/create` | POST | Tạo VietQR payment |
| `/dating/payment/verify` | POST | Verify pending payment |

---

## Appendix: Common Issues & Solutions

### A.1 "Hết lượt swipe"

**Nguyên nhân:** FREE user đã swipe 50 lần trong ngày

**Solution:**
- Chờ đến ngày mai (reset theo UTC+7)
- Upgrade lên Premium

### A.2 Discovery trống

**Nguyên nhân có thể:**
1. Đã swipe hết users trong khu vực
2. Preferences quá hẹp (vd: chỉ nữ, 18-19 tuổi, cùng khóa)
3. Profile chưa active

**Solution:**
- Mở rộng preferences
- Update location để thấy users mới

### A.3 Match không tạo được conversation

**Nguyên nhân:** Race condition hoặc transaction failed

**Solution:** Match transaction đã handle retry logic, nếu vẫn fail thì check database logs

---

*Tài liệu này được tạo để support development và maintenance của Dating Module. Vui lòng cập nhật khi có thay đổi lớn.*

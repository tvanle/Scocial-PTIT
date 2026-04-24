# PTIT Social - Dating Module Analysis

> Tài liệu phân tích module Dating - Tập trung vào luồng hoạt động
> Ngày cập nhật: 2026-04-24

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Điểm nổi bật kỹ thuật](#2-điểm-nổi-bật-kỹ-thuật)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Luồng hoạt động chi tiết](#4-luồng-hoạt-động-chi-tiết)
5. [Thuật toán](#5-thuật-toán)
6. [File Call Chain](#6-file-call-chain)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)

---

## 1. Tổng quan

### 1.1 Mô tả

Dating Module là tính năng hẹn hò trong ứng dụng PTIT Social, cho phép sinh viên PTIT tìm kiếm và kết nối với nhau thông qua cơ chế swipe.

### 1.2 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Mobile Frontend | React Native, Expo 54, TypeScript |
| State Management | React Query, Zustand |
| Navigation | React Navigation v7 |
| Animations | React Native Reanimated 3, Gesture Handler |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Thanh toán | VNPay, VietQR, SePay |
| Push Notifications | Firebase Cloud Messaging |
| Storage | MinIO (S3-compatible) |

### 1.3 Tính năng chính

- **Discovery**: Khám phá hồ sơ với swipe cards animation
- **Matching**: Hệ thống match khi cả 2 cùng like
- **Chat**: Nhắn tin real-time với người đã match
- **Premium**: Gói nâng cấp với Super Like, Rewind, xem ai like mình
- **Location-based**: Hiển thị khoảng cách dựa trên GPS
- **Preferences**: Bộ lọc theo giới tính, tuổi, ngành học, khoảng cách
- **Settings** : block các thứ 

---

## 2. Điểm nổi bật kỹ thuật

> Các implementation ấn tượng thể hiện kỹ năng technical cao

---

### 2.1 Swipeable Card với Gesture Physics

**File:** `src/screens/dating/components/SwipeableCard.tsx`

#### 2.1.1 Tổng quan vấn đề

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VẤN ĐỀ CẦN GIẢI QUYẾT                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Animation phải MƯỢT 60fps                                              │
│     - React Native mặc định chạy animation trên JS thread                  │
│     - JS thread bận → animation giật lag                                   │
│                                                                             │
│  2. Gesture phải NHẠY và CHÍNH XÁC                                         │
│     - Phân biệt tap vs pan (kéo)                                          │
│     - Phát hiện swipe dựa trên cả vị trí VÀ vận tốc                       │
│                                                                             │
│  3. Physics phải TỰ NHIÊN                                                  │
│     - Card xoay theo hướng kéo                                            │
│     - Thả giữa chừng → spring về vị trí cũ                                │
│     - Giống cảm giác Tinder thật                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Giải pháp: React Native Reanimated 3

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  KIẾN TRÚC REANIMATED                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    TRADITIONAL REACT NATIVE                        │   │
│  │                                                                     │   │
│  │  ┌──────────────┐      Bridge      ┌──────────────┐               │   │
│  │  │  JS Thread   │◄────────────────►│  UI Thread   │               │   │
│  │  │              │    (serialized   │              │               │   │
│  │  │  Animation   │     messages)    │   Render     │               │   │
│  │  │  Logic       │                  │              │               │   │
│  │  └──────────────┘                  └──────────────┘               │   │
│  │                                                                     │   │
│  │  Problem: Bridge là bottleneck → Giật lag khi JS bận              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    WITH REANIMATED 3                               │   │
│  │                                                                     │   │
│  │  ┌──────────────┐                  ┌──────────────┐               │   │
│  │  │  JS Thread   │                  │  UI Thread   │               │   │
│  │  │              │                  │              │               │   │
│  │  │  Define      │─────────────────►│  Execute     │               │   │
│  │  │  Animation   │   (worklets)     │  Animation   │               │   │
│  │  │  (one time)  │                  │  (60fps)     │               │   │
│  │  └──────────────┘                  └──────────────┘               │   │
│  │                                                                     │   │
│  │  Solution: Animation code chạy TRỰC TIẾP trên UI thread           │   │
│  │            → Không qua bridge → 60fps mượt mà                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.3 Chi tiết Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. SHARED VALUES                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Khởi tạo shared values                                                 │
│  const translateX = useSharedValue(0);                                     │
│  const translateY = useSharedValue(0);                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Shared Value là gì?                                                │   │
│  │                                                                     │   │
│  │  - Giá trị ĐƯỢC CHIA SẺ giữa JS thread và UI thread                │   │
│  │  - Khi thay đổi, UI thread tự động update mà không cần gọi JS     │   │
│  │  - Không trigger React re-render                                   │   │
│  │                                                                     │   │
│  │  So sánh với useState:                                             │   │
│  │  ┌─────────────────┬─────────────────────────────────────────────┐ │   │
│  │  │ useState        │ useSharedValue                              │ │   │
│  │  ├─────────────────┼─────────────────────────────────────────────┤ │   │
│  │  │ Trigger render  │ Không trigger render                        │ │   │
│  │  │ JS thread only  │ Shared JS + UI thread                       │ │   │
│  │  │ Async update    │ Sync update (instant)                       │ │   │
│  │  │ 30-60fps        │ Always 60fps                                │ │   │
│  │  └─────────────────┴─────────────────────────────────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. PAN GESTURE HANDLER                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  const panGesture = Gesture.Pan()                                          │
│    .onUpdate((event) => {                                                  │
│      // Cập nhật vị trí card theo ngón tay                                │
│      translateX.value = event.translationX;                               │
│      translateY.value = event.translationY;                               │
│    })                                                                      │
│    .onEnd((event) => {                                                     │
│      // Xử lý khi thả tay                                                 │
│      const { translationX, velocityX } = event;                           │
│                                                                             │
│      // Check swipe right                                                  │
│      if (translationX > THRESHOLD || velocityX > VELOCITY_THRESHOLD) {    │
│        // Swipe right → Like                                              │
│        translateX.value = withTiming(SCREEN_WIDTH * 1.5);                 │
│        runOnJS(onSwipe)('right');                                         │
│      }                                                                     │
│      // Check swipe left                                                   │
│      else if (translationX < -THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {│
│        // Swipe left → Nope                                               │
│        translateX.value = withTiming(-SCREEN_WIDTH * 1.5);                │
│        runOnJS(onSwipe)('left');                                          │
│      }                                                                     │
│      // Thả giữa chừng → spring về                                        │
│      else {                                                                │
│        translateX.value = withSpring(0);                                  │
│        translateY.value = withSpring(0);                                  │
│      }                                                                     │
│    });                                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SWIPE DETECTION LOGIC                                              │   │
│  │                                                                     │   │
│  │  Không chỉ check vị trí (translationX):                            │   │
│  │  - User kéo chậm 150px → chưa chắc muốn swipe                      │   │
│  │                                                                     │   │
│  │  Còn check vận tốc (velocityX):                                    │   │
│  │  - User flick nhanh 50px với velocity cao → chắc chắn muốn swipe  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │                                                              │  │   │
│  │  │  Swipe = (|translationX| > 120px)                           │  │   │
│  │  │       OR (|velocityX| > 500px/s)                            │  │   │
│  │  │                                                              │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. ROTATION INTERPOLATION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  const animatedStyle = useAnimatedStyle(() => {                            │
│    // Tính góc xoay dựa trên vị trí X                                     │
│    const rotate = interpolate(                                             │
│      translateX.value,                                                     │
│      [-200, 0, 200],      // Input range                                  │
│      [-12, 0, 12],        // Output range (degrees)                       │
│      Extrapolation.CLAMP  // Không vượt quá -12 hoặc 12                   │
│    );                                                                      │
│                                                                             │
│    return {                                                                │
│      transform: [                                                          │
│        { translateX: translateX.value },                                  │
│        { translateY: translateY.value },                                  │
│        { rotate: `${rotate}deg` },                                        │
│      ],                                                                    │
│    };                                                                      │
│  });                                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  INTERPOLATION VISUALIZATION                                        │   │
│  │                                                                     │   │
│  │  translateX:  -200px        0px         +200px                     │   │
│  │                  │           │            │                        │   │
│  │                  ▼           ▼            ▼                        │   │
│  │  rotation:     -12°         0°          +12°                       │   │
│  │                                                                     │   │
│  │       ╲                     │                    ╱                 │   │
│  │        ╲                    │                   ╱                  │   │
│  │     ┌───────┐          ┌───────┐          ┌───────┐               │   │
│  │     │       │          │       │          │       │               │   │
│  │     │ -12°  │          │  0°   │          │ +12°  │               │   │
│  │     │       │          │       │          │       │               │   │
│  │     └───────┘          └───────┘          └───────┘               │   │
│  │     Kéo trái           Trung tâm          Kéo phải               │   │
│  │                                                                     │   │
│  │  → Tạo cảm giác card đang "ngả" theo hướng kéo                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. SPRING PHYSICS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Config cho spring animation                                            │
│  const SPRING_CONFIG = {                                                   │
│    damping: 15,      // Độ giảm chấn (càng cao → dừng nhanh hơn)          │
│    stiffness: 150,   // Độ cứng lò xo (càng cao → nảy nhanh hơn)          │
│    mass: 1,          // Khối lượng (càng cao → chuyển động chậm hơn)      │
│  };                                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SPRING ANIMATION PHYSICS                                           │   │
│  │                                                                     │   │
│  │  Công thức vật lý:                                                 │   │
│  │  F = -kx - cv                                                      │   │
│  │                                                                     │   │
│  │  Với:                                                              │   │
│  │  - F: lực tác động                                                 │   │
│  │  - k: stiffness (độ cứng lò xo)                                   │   │
│  │  - x: displacement (khoảng cách từ vị trí cân bằng)               │   │
│  │  - c: damping (hệ số giảm chấn)                                   │   │
│  │  - v: velocity (vận tốc)                                          │   │
│  │                                                                     │   │
│  │  Kết quả:                                                          │   │
│  │                                                                     │   │
│  │  Position                                                          │   │
│  │     │    ╭─────╮                                                   │   │
│  │     │   ╱       ╲                                                  │   │
│  │     │  ╱         ╲                                                 │   │
│  │   0 ┼─────────────────────────────────────────► Time              │   │
│  │     │              ╲         ╱                                     │   │
│  │     │               ╲───────╱                                      │   │
│  │     │                                                              │   │
│  │                                                                     │   │
│  │  → Animation "nảy" tự nhiên như vật lý thực                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. GESTURE COMPOSITION                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Tap gesture để xem profile                                             │
│  const tapGesture = Gesture.Tap()                                          │
│    .onEnd(() => {                                                          │
│      runOnJS(onTap)();                                                     │
│    });                                                                      │
│                                                                             │
│  // Kết hợp tap và pan                                                     │
│  const combinedGesture = Gesture.Race(tapGesture, panGesture);             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  TẠI SAO DÙNG Gesture.Race()?                                       │   │
│  │                                                                     │   │
│  │  Vấn đề: Tap và Pan conflict với nhau                             │   │
│  │  - Khi tap, có thể bị hiểu nhầm là pan                            │   │
│  │  - Khi bắt đầu pan, có thể trigger tap                            │   │
│  │                                                                     │   │
│  │  Giải pháp: Gesture.Race()                                        │   │
│  │  - Cả 2 gestures "chạy đua"                                       │   │
│  │  - Gesture nào activate trước thì thắng                           │   │
│  │  - Gesture kia bị cancel                                          │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ User touch down                                             │   │   │
│  │  │      │                                                      │   │   │
│  │  │      ├── Không di chuyển → Tap wins → Mở profile           │   │   │
│  │  │      │                                                      │   │   │
│  │  │      └── Di chuyển > 10px → Pan wins → Swipe card          │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  6. IMPERATIVE HANDLE (Programmatic Swipe)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Component expose methods qua ref                                       │
│  useImperativeHandle(ref, () => ({                                         │
│    swipeLeft: () => {                                                      │
│      translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {                 │
│        duration: 300                                                       │
│      }, () => {                                                            │
│        runOnJS(onSwipe)('left');                                          │
│      });                                                                   │
│    },                                                                      │
│    swipeRight: () => {                                                     │
│      translateX.value = withTiming(SCREEN_WIDTH * 1.5, {                  │
│        duration: 300                                                       │
│      }, () => {                                                            │
│        runOnJS(onSwipe)('right');                                         │
│      });                                                                   │
│    },                                                                      │
│  }));                                                                      │
│                                                                             │
│  // Parent component gọi:                                                  │
│  cardRef.current.swipeRight();  // Trigger swipe từ Like button           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  USE CASE                                                           │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │                    [Card]                                   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │        [❌ Nope]         [⭐]         [💚 Like]                    │   │
│  │            │                              │                        │   │
│  │            │                              │                        │   │
│  │            ▼                              ▼                        │   │
│  │     cardRef.swipeLeft()          cardRef.swipeRight()              │   │
│  │                                                                     │   │
│  │  → Buttons trigger swipe animation programmatically               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.4 Tại sao implementation này ấn tượng?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ĐIỂM NỔI BẬT                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ PERFORMANCE                                                            │
│     - Animation chạy native 60fps                                          │
│     - Không block JS thread                                               │
│     - Không re-render React components                                    │
│                                                                             │
│  ✅ UX QUALITY                                                             │
│     - Physics-based animation tự nhiên                                    │
│     - Velocity detection cho precise swipe                                │
│     - Rotation interpolation cho visual feedback                          │
│                                                                             │
│  ✅ CODE ARCHITECTURE                                                      │
│     - Clean separation of concerns                                        │
│     - Reusable component với ref API                                      │
│     - Configurable thresholds                                             │
│                                                                             │
│  ✅ TƯƠNG ĐƯƠNG PRODUCTION APPS                                            │
│     - Cùng kỹ thuật với Tinder, Bumble, Hinge                            │
│     - Industry-standard approach                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Card Stack với Visual Depth Effect

**File:** `src/screens/dating/components/CardStack.tsx`

#### 2.2.1 Vấn đề cần giải quyết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VISUAL DEPTH CHALLENGE                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mục tiêu: Tạo hiệu ứng "stack" 3D giống Tinder                           │
│                                                                             │
│  Yêu cầu:                                                                  │
│  1. Nhiều cards xếp chồng lên nhau                                        │
│  2. Card dưới nhỏ hơn, mờ hơn, ở phía sau                                 │
│  3. Khi swipe card trên, cards dưới animate lên                           │
│  4. Performance tốt (không lag)                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │      MỤC TIÊU VISUAL:                                              │   │
│  │                                                                     │   │
│  │              ┌─────────────────────┐                               │   │
│  │              │                     │  ← Card trên cùng             │   │
│  │              │     FRONT CARD      │     100% size, 100% opacity   │   │
│  │              │                     │                               │   │
│  │              └─────────────────────┘                               │   │
│  │             ┌───────────────────────┐                              │   │
│  │             │                       │  ← Card thứ 2                │   │
│  │             │      BACK CARD        │     95% size, 90% opacity    │   │
│  │             └───────────────────────┘                              │   │
│  │            ┌─────────────────────────┐                             │   │
│  │            │                         │  ← Card thứ 3               │   │
│  │            │       BACK CARD         │     90% size, 80% opacity   │   │
│  │            └─────────────────────────┘                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Giải pháp: Stack Position Calculation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STACK CONFIGURATION                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  const STACK_CONFIG = {                                                    │
│    visibleCards: 3,        // Chỉ render 3 cards visible                   │
│    scaleDecrement: 0.05,   // Mỗi card nhỏ hơn 5%                          │
│    yOffset: 10,            // Mỗi card dịch lên 10px                       │
│    opacityDecrement: 0.1,  // Mỗi card mờ đi 10%                          │
│  };                                                                        │
│                                                                             │
│  CÔNG THỨC TÍNH POSITION:                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function calculateStackPosition(index):                           │   │
│  │                                                                     │   │
│  │    scale    = 1 - (index × scaleDecrement)                         │   │
│  │    translateY = -(index × yOffset)                                 │   │
│  │    opacity  = 1 - (index × opacityDecrement)                       │   │
│  │    zIndex   = visibleCards - index                                 │   │
│  │                                                                     │   │
│  │    return { scale, translateY, opacity, zIndex }                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ TÍNH TOÁN:                                                          │
│  ┌───────────┬─────────┬─────────────┬─────────┬─────────┐                │
│  │ Card      │ Scale   │ TranslateY  │ Opacity │ zIndex  │                │
│  ├───────────┼─────────┼─────────────┼─────────┼─────────┤                │
│  │ index 0   │ 1.00    │ 0px         │ 1.0     │ 3       │                │
│  │ index 1   │ 0.95    │ -10px       │ 0.9     │ 2       │                │
│  │ index 2   │ 0.90    │ -20px       │ 0.8     │ 1       │                │
│  └───────────┴─────────┴─────────────┴─────────┴─────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.3 Render Order và Z-Index

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REVERSE RENDERING ORDER                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VẤN ĐỀ: React render theo thứ tự trong array                             │
│  - Card index 0 render trước                                              │
│  - Card index 2 render sau → nằm ĐÈ LÊN card 0                            │
│                                                                             │
│  GIẢI PHÁP: Render ngược + zIndex                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  // Đảo ngược thứ tự render                                        │   │
│  │  {profiles.slice().reverse().map((profile, reversedIndex) => {     │   │
│  │    const actualIndex = profiles.length - 1 - reversedIndex;        │   │
│  │                                                                     │   │
│  │    return (                                                        │   │
│  │      <StackedCard                                                  │   │
│  │        key={profile.userId}                                        │   │
│  │        index={actualIndex}                                         │   │
│  │        style={{ zIndex: visibleCards - actualIndex }}              │   │
│  │      />                                                            │   │
│  │    );                                                              │   │
│  │  })}                                                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  RENDER ORDER:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Array:    [Card0, Card1, Card2]                                   │   │
│  │                                                                     │   │
│  │  Reversed: [Card2, Card1, Card0]                                   │   │
│  │                                                                     │   │
│  │  Render:   Card2 (zIndex: 1) → dưới cùng                          │   │
│  │            Card1 (zIndex: 2) → giữa                               │   │
│  │            Card0 (zIndex: 3) → trên cùng ✓                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.4 Animated Stack Shuffle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHUFFLE ANIMATION                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Khi swipe card trên:                                                      │
│                                                                             │
│  BEFORE SWIPE:                 AFTER SWIPE:                                │
│  ┌─────────┐ Card0             ← Swipe away                               │
│  └─────────┘                                                               │
│  ┌───────┐   Card1             ┌─────────┐ Card1 (animate lên)            │
│  └───────┘                     └─────────┘ scale: 0.95 → 1.0              │
│  ┌─────┐     Card2             ┌───────┐   Card2 (animate lên)            │
│  └─────┘                       └───────┘   scale: 0.90 → 0.95             │
│                                ┌─────┐     Card3 (mới appear)              │
│                                └─────┘     scale: 0.85 → 0.90             │
│                                                                             │
│  ANIMATION CODE:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  const animatedStyle = useAnimatedStyle(() => {                    │   │
│  │    // Khi không phải active card, animate properties               │   │
│  │    if (!isActive) {                                                │   │
│  │      return {                                                      │   │
│  │        transform: [                                                │   │
│  │          {                                                         │   │
│  │            scale: withSpring(                                      │   │
│  │              stackPosition.scale,                                  │   │
│  │              { damping: 15, stiffness: 150 }                       │   │
│  │            )                                                       │   │
│  │          },                                                        │   │
│  │          {                                                         │   │
│  │            translateY: withSpring(                                 │   │
│  │              stackPosition.translateY,                             │   │
│  │              { damping: 15, stiffness: 150 }                       │   │
│  │            )                                                       │   │
│  │          },                                                        │   │
│  │        ],                                                          │   │
│  │        opacity: withSpring(                                        │   │
│  │          stackPosition.opacity,                                    │   │
│  │          { damping: 15, stiffness: 150 }                           │   │
│  │        ),                                                          │   │
│  │      };                                                            │   │
│  │    }                                                               │   │
│  │  });                                                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  → Tất cả cards dưới animate CÙNG LÚC với spring physics                  │
│  → Tạo hiệu ứng "shuffle" mượt mà                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.5 Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE OPTIMIZATIONS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LAZY RENDERING                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  // Chỉ render visible cards                                       │   │
│  │  const visibleProfiles = profiles.slice(0, STACK.visibleCards);    │   │
│  │                                                                     │   │
│  │  // Có 100 profiles trong feed                                     │   │
│  │  // Chỉ render 3 cards                                             │   │
│  │  // → Giảm 97% render work                                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  2. MEMOIZATION                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  // Memoize stack position calculation                             │   │
│  │  const stackPosition = useMemo(() => {                             │   │
│  │    return calculatePosition(index);                                │   │
│  │  }, [index]);  // Chỉ recalculate khi index thay đổi              │   │
│  │                                                                     │   │
│  │  // Memoize callbacks                                              │   │
│  │  const handleSwipe = useCallback((direction) => {                  │   │
│  │    onSwipe(profiles[0], direction);                                │   │
│  │  }, [profiles, onSwipe]);                                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  3. POINTER EVENTS OPTIMIZATION                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  // Background cards không nhận touch events                       │   │
│  │  <Animated.View                                                    │   │
│  │    style={[                                                        │   │
│  │      styles.backgroundCard,                                        │   │
│  │      { pointerEvents: 'none' }  // Disable touch                   │   │
│  │    ]}                                                              │   │
│  │  />                                                                │   │
│  │                                                                     │   │
│  │  → Giảm overhead xử lý touch events                                │   │
│  │  → Chỉ card active mới nhận touch                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.6 Điểm nổi bật

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẠI SAO IMPLEMENTATION NÀY ẤN TƯỢNG?                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ VISUAL QUALITY                                                         │
│     - 3D depth effect giống hệt Tinder                                    │
│     - Smooth shuffle animation                                            │
│     - Professional look & feel                                            │
│                                                                             │
│  ✅ PERFORMANCE                                                            │
│     - Chỉ render 3 cards (không phải toàn bộ feed)                        │
│     - Memoization cho calculations                                        │
│     - Disable touch trên background cards                                 │
│                                                                             │
│  ✅ ARCHITECTURE                                                           │
│     - Configurable stack parameters                                       │
│     - Clean component composition                                         │
│     - Ref forwarding cho parent control                                   │
│                                                                             │
│  ✅ REUSABILITY                                                            │
│     - Generic CardStack component                                         │
│     - Works với any ProfileCard                                           │
│     - Easy to customize                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Smart Scoring Algorithm với Weighted Multi-Factor

**File:** `backend/src/modules/dating/discovery/scoring.service.ts`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURABLE WEIGHTED SCORING SYSTEM                                        │
│  Thuật toán ranking profiles với nhiều factors                              │
└─────────────────────────────────────────────────────────────────────────────┘

SCORING CONFIG (dễ dàng tune):
┌─────────────────────────────────────────────────────────────────────────────┐
│  weights: {                                                                  │
│    ageMatch: 30,          // Tuổi phù hợp với preference                    │
│    genderMatch: 20,       // Giới tính phù hợp                              │
│    majorMatch: 20,        // Cùng ngành học                                 │
│    sameYear: 10,          // Cùng khóa                                      │
│    profileCompleteness: 10, // Profile đầy đủ                               │
│    recentActivity: 10,    // Hoạt động gần đây                              │
│  }                                                                           │
│                                                                              │
│  fallback: {                                                                 │
│    noPref: 0.5,    // Khi user không set preference                         │
│    noData: 0.3,    // Khi candidate thiếu data                              │
│    weakMatch: 0.1, // Match yếu                                             │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

AGE SCORING (không phải binary match):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Preference: 20-28 tuổi                                                     │
│  Center: 24 tuổi                                                            │
│                                                                              │
│  Score                                                                       │
│    30 ┤                    ████                                             │
│       │                  ██    ██                                           │
│    20 ┤                ██        ██                                         │
│       │              ██            ██                                       │
│    10 ┤            ██                ██                                     │
│       │          ██                    ██                                   │
│     0 ┼────────██────────────────────────██───────                          │
│       18  20  22  24  26  28  30  32                                        │
│                     Tuổi                                                    │
│                                                                              │
│  → Tuổi càng gần center, điểm càng cao (gradient, không binary)            │
└─────────────────────────────────────────────────────────────────────────────┘

ACTIVITY DECAY FUNCTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  lastActiveAt        Score                                                  │
│  ─────────────────────────────                                              │
│  < 1 giờ             10 điểm (100%)                                         │
│  < 24 giờ            7 điểm (70%)                                           │
│  < 3 ngày            4 điểm (40%)                                           │
│  < 7 ngày            2 điểm (20%)                                           │
│  > 7 ngày            0 điểm                                                 │
│                                                                              │
│  → Ưu tiên users đang active, không hiện "ghost profiles"                  │
└─────────────────────────────────────────────────────────────────────────────┘

PROFILE COMPLETENESS SCORING:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Component                    Weight                                        │
│  ─────────────────────────────────────                                      │
│  Photos ≥ 3                   40%                                           │
│  Photos ≥ 1                   20%                                           │
│  Bio ≥ 20 chars               30%                                           │
│  Bio exists                   10%                                           │
│  Has education                15%                                           │
│  Has fullName                 15%                                           │
│  ─────────────────────────────────────                                      │
│  Total                        100% → × 10 điểm                              │
│                                                                              │
│  → Khuyến khích users hoàn thiện profile                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Configurable weights: dễ A/B test và tune
- Gradient scoring: không phải binary match/no-match
- Fallback handling: graceful khi thiếu data
- Activity decay: tự động demote inactive users

---

### 2.4 CTE-based Haversine Query với Bounding Box Optimization

**File:** `backend/src/modules/dating/location/location.service.ts`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OPTIMIZED GEOSPATIAL QUERY                                                  │
│  Single query với multiple optimizations                                    │
└─────────────────────────────────────────────────────────────────────────────┘

PROBLEM: Tính khoảng cách cho hàng nghìn users rất chậm

SOLUTION: 3-stage optimization

┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: BOUNDING BOX PRE-FILTER (rất nhanh)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│       maxDistance = 50km                                                    │
│       latDelta = 50 / 111 ≈ 0.45°                                          │
│       lngDelta = 50 / (111 × cos(lat)) ≈ 0.6°                              │
│                                                                              │
│              ┌─────────────────────┐                                        │
│              │  Bounding Box       │                                        │
│              │    (Square)         │                                        │
│              │        ●────────────┼── User trong box                       │
│              │      ╱   ╲          │   → Tiếp tục check                     │
│              │    ╱   ●   ╲        │                                        │
│              │   ╱  (Me)   ╲       │                                        │
│              │   ╲         ╱       │                                        │
│              │    ╲   ●   ╱        │   ● User trong circle                  │
│              │      ╲   ╱          │   → Kết quả cuối                       │
│              │   ●───────────────● │   ● User ngoài circle                  │
│              └─────────────────────┘   → Loại ở stage 2                     │
│                                                                              │
│  → Loại bỏ 90%+ candidates chỉ với simple comparison                       │
│  → Không cần tính Haversine cho tất cả                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: HAVERSINE IN CTE (Common Table Expression)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WITH nearby AS (                                                           │
│    SELECT                                                                   │
│      ...,                                                                   │
│      (6371 × acos(                                                          │
│        cos(radians(myLat)) × cos(radians(lat))                             │
│        × cos(radians(lng) - radians(myLng))                                │
│        + sin(radians(myLat)) × sin(radians(lat))                           │
│      )) AS distance     ← Tính một lần, dùng nhiều lần                     │
│    FROM ...                                                                 │
│    WHERE                                                                    │
│      lat BETWEEN myLat-delta AND myLat+delta    ← Bounding box             │
│      AND lng BETWEEN myLng-delta AND myLng+delta                           │
│  )                                                                          │
│  SELECT * FROM nearby                                                       │
│  WHERE distance <= maxDistance    ← Filter chính xác                       │
│  ORDER BY distance ASC                                                      │
│                                                                              │
│  → CTE tính distance 1 lần, dùng cho cả WHERE và ORDER BY                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: WINDOW FUNCTION FOR PAGINATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SELECT *, COUNT(*) OVER() AS total_count                                   │
│  FROM nearby                                                                │
│  WHERE distance <= maxDistance                                              │
│  LIMIT 10 OFFSET 0                                                          │
│                                                                              │
│  → Single query trả về cả data VÀ total count                              │
│  → Không cần 2 queries riêng (SELECT + COUNT)                              │
│  → Giảm 50% database round-trips                                           │
└─────────────────────────────────────────────────────────────────────────────┘

NUMERIC STABILITY:
┌─────────────────────────────────────────────────────────────────────────────┐
│  LEAST(1.0, GREATEST(-1.0, ...))                                            │
│                                                                              │
│  → acos() chỉ nhận input trong [-1, 1]                                     │
│  → Floating point errors có thể tạo ra 1.0000001                           │
│  → Clamp để tránh NaN errors                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Bounding box: O(1) pre-filter thay vì O(n) Haversine
- CTE: tính distance một lần, dùng nhiều nơi
- Window function: single query cho data + count
- Numeric stability: handle floating point edge cases

---

### 2.5 Smart Discovery Feed với Prefetch & Match Detection

**File:** `src/screens/dating/discovery/hooks/useDiscoveryFeed.ts`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INTELLIGENT FEED MANAGEMENT                                                 │
│  Quản lý feed với multiple optimizations                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. PREFETCH THRESHOLD
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Cards: [0] [1] [2] [3] [4] [5] [6] [7] [8] [9]                             │
│          ▲                           ▲                                       │
│     currentIdx                  threshold                                   │
│                                                                              │
│  Khi currentIdx >= length - prefetchThreshold:                              │
│  → Tự động loadMore() page tiếp theo                                       │
│  → User không bao giờ thấy loading spinner                                 │
│  → Infinite scroll seamless                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

2. REMOVED USERS TRACKING
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  removedUserIdsRef = Set { "user1", "user2", ... }                         │
│                                                                              │
│  → Khi match, add userId vào Set                                           │
│  → Khi fetch new page, filter out removed users                            │
│  → Tránh hiện lại người đã match/swipe                                     │
│  → Persist across pagination                                               │
└─────────────────────────────────────────────────────────────────────────────┘

3. MATCH DETECTION WITHOUT REFETCH
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Traditional approach:                                                      │
│  Swipe → API → Success → Invalidate query → Refetch all → Reset index      │
│                    ↓                                                        │
│            Cards bị reset, user quay về đầu                                │
│                                                                              │
│  Our approach:                                                              │
│  Swipe → API → Success → Check matched → Update local state                │
│                    ↓                                                        │
│            Giữ nguyên cards + index, chỉ update khi cần                    │
│                                                                              │
│  → Không refetch khi swipe thành công                                      │
│  → Chỉ remove matched user khỏi local array                                │
│  → currentIdx giữ nguyên position                                          │
└─────────────────────────────────────────────────────────────────────────────┘

4. REF-BASED STATE FOR CALLBACKS
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  const cardsLengthRef = useRef(cards.length);                              │
│  const currentCardRef = useRef(currentCard);                               │
│                                                                              │
│  useEffect(() => {                                                          │
│    cardsLengthRef.current = cards.length;                                  │
│  }, [cards.length]);                                                        │
│                                                                              │
│  → Callbacks luôn access latest value                                      │
│  → Không cần recreate callbacks khi state change                           │
│  → Tránh stale closure problem                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Prefetch: UX mượt không loading
- Local state management: tránh unnecessary refetch
- Ref pattern: giải quyết stale closure elegantly

---

### 2.6 Optimistic UI Updates cho Chat

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  OPTIMISTIC UPDATE PATTERN                                                   │
│  UI update trước, rollback nếu fail                                        │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL (Pessimistic):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  User nhấn Send                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  [Loading spinner] ──────── 500ms+ ────────▶ Message xuất hiện             │
│       │                                             │                       │
│       └── User phải đợi ────────────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

OPTIMISTIC (Our approach):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  User nhấn Send                                                             │
│       │                                                                     │
│       ├──▶ [1] Add temp message to UI (INSTANT)                            │
│       │         id: "temp-{timestamp}"                                      │
│       │         status: "sending"                                          │
│       │                                                                     │
│       ├──▶ [2] POST to API (background)                                    │
│       │                                                                     │
│       │    ┌─────────────────────────────────────────┐                     │
│       │    │           API Response                  │                     │
│       │    └─────────────────────────────────────────┘                     │
│       │              │                    │                                 │
│       │         SUCCESS                 ERROR                               │
│       │              │                    │                                 │
│       ▼              ▼                    ▼                                 │
│  [3] Replace temp    [4] Keep real       [5] Show retry                    │
│      with real msg       message             or remove                     │
│                                                                              │
│  → User thấy message xuất hiện NGAY LẬP TỨC                                │
│  → Cảm giác app rất nhanh và responsive                                    │
└─────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  useMutation({                                                              │
│    mutationFn: sendMessage,                                                 │
│                                                                              │
│    onMutate: async (content) => {                                          │
│      // Cancel outgoing refetches                                          │
│      await queryClient.cancelQueries({ queryKey });                        │
│                                                                              │
│      // Snapshot previous value                                            │
│      const previous = queryClient.getQueryData(queryKey);                  │
│                                                                              │
│      // Optimistically update                                              │
│      queryClient.setQueryData(queryKey, (old) => ({                        │
│        ...old,                                                              │
│        messages: [...old.messages, tempMessage],                           │
│      }));                                                                   │
│                                                                              │
│      return { previous };  // For rollback                                 │
│    },                                                                       │
│                                                                              │
│    onError: (err, content, context) => {                                   │
│      // Rollback on error                                                  │
│      queryClient.setQueryData(queryKey, context.previous);                 │
│    },                                                                       │
│                                                                              │
│    onSuccess: (realMessage) => {                                           │
│      // Replace temp with real                                             │
│      queryClient.setQueryData(queryKey, (old) => ({                        │
│        ...old,                                                              │
│        messages: old.messages.map(m =>                                     │
│          m.id.startsWith('temp-') ? realMessage : m                        │
│        ),                                                                   │
│      }));                                                                   │
│    },                                                                       │
│  });                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Perceived performance tăng đáng kể
- Rollback mechanism cho error handling
- Standard pattern của các big apps (Facebook, WhatsApp)

---

### 2.7 Multi-Gateway Payment với Webhook Verification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAYMENT INTEGRATION ARCHITECTURE                                            │
│  3 payment gateways với unified interface                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   PaymentService    │
                    │   (Orchestrator)    │
                    └─────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ VNPayService │  │VietQRService │  │ SePayService │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Redirect    │  │   QR Code    │  │   Webhook    │
    │   Flow       │  │    Flow      │  │    Flow      │
    └──────────────┘  └──────────────┘  └──────────────┘

VNPAY - HMAC-SHA512 SIGNATURE:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Create Payment URL:                                                        │
│  1. Build params object (amount, orderInfo, txnRef, ...)                   │
│  2. Sort params alphabetically                                             │
│  3. Create query string: key1=value1&key2=value2&...                       │
│  4. HMAC-SHA512(queryString, secretKey)                                    │
│  5. Append vnp_SecureHash to URL                                           │
│                                                                              │
│  Verify Return URL:                                                         │
│  1. Extract vnp_SecureHash from params                                     │
│  2. Remove hash from params                                                │
│  3. Re-calculate hash với remaining params                                 │
│  4. Compare: receivedHash === calculatedHash                               │
│                                                                              │
│  → Đảm bảo data không bị tamper trên đường truyền                         │
└─────────────────────────────────────────────────────────────────────────────┘

VIETQR + SEPAY WEBHOOK:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. Generate unique transaction code: PTIT{timestamp}{random}              │
│                                                                              │
│  2. Create pending transaction in DB                                       │
│     status: PENDING                                                        │
│     transactionCode: "PTIT1234567890"                                      │
│                                                                              │
│  3. Generate VietQR URL với transferInfo chứa transaction code            │
│     "PTIT Premium PTIT1234567890"                                          │
│                                                                              │
│  4. User scan QR, chuyển tiền qua ngân hàng                               │
│                                                                              │
│  5. SePay detect transaction, gọi webhook                                  │
│     POST /sepay/webhook                                                     │
│     {                                                                       │
│       content: "PTIT Premium PTIT1234567890",                              │
│       transferAmount: 99000,                                               │
│       ...                                                                   │
│     }                                                                       │
│                                                                              │
│  6. Backend:                                                               │
│     - Parse transaction code from content                                  │
│     - Find pending transaction                                             │
│     - Verify amount matches                                                │
│     - Update status: SUCCESS                                               │
│     - Upgrade subscription                                                 │
│                                                                              │
│  → Fully automated, không cần user confirm thủ công                       │
└─────────────────────────────────────────────────────────────────────────────┘

TRANSACTION STATE MACHINE:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────┐    success    ┌──────────┐                                   │
│  │ PENDING  │──────────────▶│ SUCCESS  │                                   │
│  └──────────┘               └──────────┘                                   │
│       │                           │                                        │
│       │ timeout/fail              │                                        │
│       ▼                           ▼                                        │
│  ┌──────────┐              ┌──────────────┐                                │
│  │ FAILED   │              │ SUBSCRIPTION │                                │
│  └──────────┘              │   UPGRADED   │                                │
│                            └──────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Multiple payment gateways với unified interface
- Cryptographic verification (HMAC-SHA512)
- Webhook integration cho automatic confirmation
- Transaction state machine cho reliability

---

### 2.8 Real-time Socket Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SOCKET.IO REAL-TIME SYSTEM                                                  │
│  Bidirectional communication cho chat & notifications                       │
└─────────────────────────────────────────────────────────────────────────────┘

ROOM-BASED ARCHITECTURE:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                      ┌─────────────────┐                                    │
│                      │  Socket Server  │                                    │
│                      └─────────────────┘                                    │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│  │ user:abc123 │     │ user:def456 │     │ user:ghi789 │                  │
│  │   (Room)    │     │   (Room)    │     │   (Room)    │                  │
│  └─────────────┘     └─────────────┘     └─────────────┘                  │
│         │                    │                                              │
│         │                    │                                              │
│         ▼                    ▼                                              │
│     ┌───────┐            ┌───────┐                                         │
│     │User A │            │User B │                                         │
│     │Device1│            │Device1│                                         │
│     └───────┘            │Device2│  ← Multiple devices supported          │
│                          └───────┘                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

EVENT FLOW:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  User A sends message to User B:                                           │
│                                                                              │
│  [User A Client]                                                            │
│       │                                                                     │
│       │ POST /api/chat/messages                                            │
│       ▼                                                                     │
│  [Backend]                                                                  │
│       │                                                                     │
│       ├──▶ 1. Save to database                                             │
│       │                                                                     │
│       ├──▶ 2. io.to('user:B').emit('newMessage', data)                     │
│       │         └── Gửi đến room của User B                                │
│       │                                                                     │
│       ├──▶ 3. Check if User B offline                                      │
│       │         └── Push notification via FCM                              │
│       │                                                                     │
│       └──▶ 4. Return response to User A                                    │
│                                                                              │
│  [User B Client]                                                            │
│       │                                                                     │
│       │ socket.on('newMessage', handler)                                   │
│       ▼                                                                     │
│  Update UI instantly                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

TYPING INDICATOR:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  User A typing:                                                             │
│                                                                              │
│  socket.emit('typing', { conversationId, userId: A })                      │
│       │                                                                     │
│       ▼                                                                     │
│  Server broadcasts to conversation room:                                   │
│  socket.to('conversation:123').emit('userTyping', { userId: A })           │
│       │                                                                     │
│       ▼                                                                     │
│  User B shows "A is typing..."                                             │
│                                                                              │
│  Debounced: only emit every 2 seconds to reduce traffic                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

DEDUPLICATION:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  // Frontend: prevent duplicate messages                                   │
│  socket.on('newMessage', (incoming) => {                                   │
│    // Skip if message already exists (from optimistic update)             │
│    if (messages.some(m => m.id === incoming.id)) return;                   │
│                                                                              │
│    // Skip if I sent this message (already added optimistically)          │
│    if (incoming.senderId === myId) return;                                 │
│                                                                              │
│    // Add new message from other user                                      │
│    addMessage(incoming);                                                   │
│  });                                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao ấn tượng:**
- Room-based routing cho scalability
- Hybrid: Socket + Push notifications
- Deduplication logic cho reliability
- Typing indicator với debounce

---

### 2.9 Tổng kết Technical Highlights

| Feature | Technique | Benefit |
|---------|-----------|---------|
| Swipe Cards | Reanimated + Gesture Handler | 60fps native animation |
| Card Stack | Visual depth + lazy render | Tinder-like UX |
| Discovery | Multi-factor scoring | Smart matching |
| Location | CTE + Bounding box | O(1) geo query |
| Feed | Prefetch + local state | Seamless infinite scroll |
| Chat | Optimistic updates | Instant perceived speed |
| Payment | Multi-gateway + webhook | Flexible + automated |
| Real-time | Socket.io rooms | Scalable messaging |

---

## 3. Kiến trúc hệ thống

### 3.1 File Reference Map (Bản đồ file quan trọng)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE REFERENCE MAP                                   │
│                    Danh sách file và chức năng                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### FRONTEND - Screens

| Chức năng | File Path |
|-----------|-----------|
| **Discovery (Swipe)** | `src/screens/dating/discovery/DatingDiscoveryScreen.tsx` |
| **Swipeable Card** | `src/screens/dating/components/SwipeableCard.tsx` |
| **Card Stack** | `src/screens/dating/components/CardStack.tsx` |
| **Profile Card** | `src/screens/dating/components/ProfileCard.tsx` |
| **Action Buttons** | `src/screens/dating/components/ActionButtonsBar.tsx` |
| **Chat List** | `src/screens/dating/chat/DatingChatListScreen.tsx` |
| **Chat Room** | `src/screens/dating/chat/DatingChatRoomScreen.tsx` |
| **Likes Screen** | `src/screens/dating/likes/DatingLikesScreen.tsx` |
| **Match List** | `src/screens/dating/match/DatingMatchScreen.tsx` |
| **Match Success** | `src/screens/dating/match-success/MatchSuccessScreen.tsx` |
| **Premium** | `src/screens/dating/premium/DatingPremiumScreen.tsx` |
| **Payment Result** | `src/screens/dating/premium/DatingPaymentResultScreen.tsx` |
| **Profile Detail** | `src/screens/dating/profile-detail/DatingProfileDetailScreen.tsx` |
| **My Profile** | `src/screens/dating/profile/DatingMyProfileScreen.tsx` |
| **Settings** | `src/screens/dating/settings/DatingSettingsScreen.tsx` |
| **Blocked Users** | `src/screens/dating/settings/DatingBlockedUsersScreen.tsx` |
| **Subscription** | `src/screens/dating/settings/DatingSubscriptionScreen.tsx` |
| **Onboarding Intro** | `src/screens/dating/onboarding/DatingOnboardingIntroScreen.tsx` |
| **Profile Setup** | `src/screens/dating/onboarding/DatingProfileSetupScreen.tsx` |
| **Preferences Setup** | `src/screens/dating/onboarding/DatingPreferencesSetupScreen.tsx` |
| **Location Permission** | `src/screens/dating/onboarding/DatingLocationPermissionScreen.tsx` |
| **Paused Screen** | `src/screens/dating/paused/DatingPausedScreen.tsx` |
| **Notifications** | `src/screens/dating/notifications/DatingNotificationsScreen.tsx` |
| **Splash** | `src/screens/dating/splash/DatingSplashScreen.tsx` |

#### FRONTEND - Hooks

| Chức năng | File Path |
|-----------|-----------|
| **Discovery Feed Hook** | `src/screens/dating/discovery/hooks/useDiscoveryFeed.ts` |
| **Location Hook** | `src/screens/dating/discovery/hooks/useDatingLocation.ts` |
| **Location Permission Hook** | `src/screens/dating/onboarding/components/location-permission/useLocationPermission.ts` |
| **Fade Slide Animation** | `src/screens/dating/hooks/useFadeSlideIn.ts` |
| **Press Scale Animation** | `src/screens/dating/hooks/usePressScale.ts` |

#### FRONTEND - Services (API Calls)

| Chức năng | File Path |
|-----------|-----------|
| **Main Dating Service** | `src/services/dating/datingService.ts` |
| **Chat Service** | `src/services/dating/datingChatService.ts` |
| **Payment Service** | `src/services/dating/datingPaymentService.ts` |
| **Settings Service** | `src/services/dating/datingSettingsService.ts` |

#### BACKEND - Profile Module

| Chức năng | File Path |
|-----------|-----------|
| **Profile Controller** | `backend/src/modules/dating/profile/profile.controller.ts` |
| **Profile Service** | `backend/src/modules/dating/profile/profile.service.ts` |
| **Profile Routes** | `backend/src/modules/dating/profile/profile.route.ts` |
| **Profile Schema** | `backend/src/modules/dating/profile/profile.schema.ts` |

#### BACKEND - Discovery Module

| Chức năng | File Path |
|-----------|-----------|
| **Discovery Controller** | `backend/src/modules/dating/discovery/discovery.controller.ts` |
| **Discovery Service** | `backend/src/modules/dating/discovery/discovery.service.ts` |
| **Scoring Service** | `backend/src/modules/dating/discovery/scoring.service.ts` |
| **Discovery Routes** | `backend/src/modules/dating/discovery/discovery.route.ts` |
| **Discovery Schema** | `backend/src/modules/dating/discovery/discovery.schema.ts` |

#### BACKEND - Swipe Module

| Chức năng | File Path |
|-----------|-----------|
| **Swipe Controller** | `backend/src/modules/dating/swipe/swipe.controller.ts` |
| **Swipe Service** | `backend/src/modules/dating/swipe/swipe.service.ts` |
| **Swipe Routes** | `backend/src/modules/dating/swipe/swipe.route.ts` |
| **Swipe Schema** | `backend/src/modules/dating/swipe/swipe.schema.ts` |

#### BACKEND - Match Module

| Chức năng | File Path |
|-----------|-----------|
| **Match Controller** | `backend/src/modules/dating/match/match.controller.ts` |
| **Match Service** | `backend/src/modules/dating/match/match.service.ts` |
| **Match Routes** | `backend/src/modules/dating/match/match.route.ts` |
| **Match Schema** | `backend/src/modules/dating/match/match.schema.ts` |

#### BACKEND - Location Module

| Chức năng | File Path |
|-----------|-----------|
| **Location Controller** | `backend/src/modules/dating/location/location.controller.ts` |
| **Location Service** | `backend/src/modules/dating/location/location.service.ts` |
| **Location Routes** | `backend/src/modules/dating/location/location.route.ts` |
| **Location Schema** | `backend/src/modules/dating/location/location.schema.ts` |

#### BACKEND - Chat Module

| Chức năng | File Path |
|-----------|-----------|
| **Chat Controller** | `backend/src/modules/dating/chat/dating-chat.controller.ts` |
| **Chat Service** | `backend/src/modules/dating/chat/dating-chat.service.ts` |
| **Chat Routes** | `backend/src/modules/dating/chat/dating-chat.route.ts` |
| **Chat Schema** | `backend/src/modules/dating/chat/dating-chat.schema.ts` |

#### BACKEND - Payment Module

| Chức năng | File Path |
|-----------|-----------|
| **Payment Controller** | `backend/src/modules/dating/payment/payment.controller.ts` |
| **Payment Service** | `backend/src/modules/dating/payment/payment.service.ts` |
| **VNPay Service** | `backend/src/modules/dating/payment/vnpay.service.ts` |
| **VietQR Service** | `backend/src/modules/dating/payment/vietqr.service.ts` |
| **SePay Service** | `backend/src/modules/dating/payment/sepay.service.ts` |
| **Subscription Service** | `backend/src/modules/dating/payment/subscription.service.ts` |
| **Payment Routes** | `backend/src/modules/dating/payment/payment.route.ts` |
| **Payment Schema** | `backend/src/modules/dating/payment/payment.schema.ts` |

#### DATABASE

| Chức năng | File Path |
|-----------|-----------|
| **Prisma Schema** | `backend/prisma/schema.prisma` |

---

### 3.2 Cấu trúc thư mục Frontend

```
src/
├── screens/dating/
│   ├── splash/                         # Màn hình giới thiệu
│   │   └── DatingSplashScreen.tsx
│   │
│   ├── discovery/                      # Màn hình khám phá (swipe)
│   │   ├── DatingDiscoveryScreen.tsx   # Main screen
│   │   ├── components/
│   │   │   ├── DiscoveryHeader.tsx
│   │   │   └── DiscoveryEmptyState.tsx
│   │   └── hooks/
│   │       ├── useDiscoveryFeed.ts     # ⭐ Feed management hook
│   │       └── useDatingLocation.ts    # Location tracking
│   │
│   ├── components/                     # Shared components
│   │   ├── SwipeableCard.tsx          # ⭐ Gesture + Animation
│   │   ├── CardStack.tsx              # ⭐ Visual depth stack
│   │   ├── ProfileCard.tsx            # Profile display
│   │   ├── ActionButtonsBar.tsx       # Like/Nope/SuperLike buttons
│   │   ├── ImageCarousel.tsx          # Photo carousel
│   │   └── DatingFilterForm.tsx       # Filter modal
│   │
│   ├── chat/                          # Chat dating
│   │   ├── DatingChatListScreen.tsx   # Conversations list
│   │   └── DatingChatRoomScreen.tsx   # ⭐ Chat with optimistic UI
│   │
│   ├── likes/                         # Người thích bạn
│   │   └── DatingLikesScreen.tsx      # Blur/unblur based on tier
│   │
│   ├── match/                         # Danh sách match
│   │   └── DatingMatchScreen.tsx
│   │
│   ├── match-success/                 # Màn hình chúc mừng
│   │   └── MatchSuccessScreen.tsx     # Confetti animation
│   │
│   ├── profile/                       # Hồ sơ của mình
│   │   └── DatingMyProfileScreen.tsx
│   │
│   ├── profile-detail/                # Chi tiết người khác
│   │   ├── DatingProfileDetailScreen.tsx
│   │   └── components/
│   │       ├── DetailHeroImage.tsx
│   │       ├── DetailIdentity.tsx
│   │       ├── DetailInterests.tsx
│   │       ├── DetailPhotoGrid.tsx
│   │       └── DetailActionBar.tsx
│   │
│   ├── onboarding/                    # Đăng ký hồ sơ
│   │   ├── DatingOnboardingIntroScreen.tsx
│   │   ├── DatingProfileSetupScreen.tsx
│   │   ├── DatingPreferencesSetupScreen.tsx
│   │   ├── DatingLocationPermissionScreen.tsx
│   │   └── components/
│   │       ├── profile-setup/
│   │       ├── preferences/
│   │       └── location-permission/
│   │
│   ├── premium/                       # Premium & Payment
│   │   ├── DatingPremiumScreen.tsx    # Plans display
│   │   └── DatingPaymentResultScreen.tsx
│   │
│   ├── settings/                      # Cài đặt
│   │   ├── DatingSettingsScreen.tsx
│   │   ├── DatingBlockedUsersScreen.tsx
│   │   └── DatingSubscriptionScreen.tsx
│   │
│   ├── paused/                        # Tạm dừng
│   │   └── DatingPausedScreen.tsx
│   │
│   └── notifications/                 # Thông báo
│       └── DatingNotificationsScreen.tsx
│
├── services/dating/
│   ├── datingService.ts              # ⭐ Main API service
│   ├── datingChatService.ts          # Chat API
│   ├── datingPaymentService.ts       # Payment API
│   └── datingSettingsService.ts      # Settings API
│
├── types/dating.ts                   # TypeScript types
│
├── constants/dating/
│   ├── design-system/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── animations.ts
│   ├── theme.ts
│   ├── strings.ts
│   └── interests.ts
│
└── navigation/
    └── DatingTabNavigator.tsx        # Bottom tabs
```

### 3.3 Cấu trúc thư mục Backend

```
backend/src/modules/dating/
│
├── dating.routes.ts                  # Main router
├── index.ts                          # Module export
│
├── profile/                          # Profile management
│   ├── profile.controller.ts
│   ├── profile.service.ts           # CRUD operations
│   ├── profile.route.ts
│   ├── profile.schema.ts            # Zod validation
│   └── index.ts
│
├── discovery/                        # Feed & Scoring
│   ├── discovery.controller.ts
│   ├── discovery.service.ts         # Get candidates
│   ├── scoring.service.ts           # ⭐ Scoring algorithm
│   ├── discovery.route.ts
│   ├── discovery.schema.ts
│   └── index.ts
│
├── swipe/                           # Like/Dislike/SuperLike
│   ├── swipe.controller.ts
│   ├── swipe.service.ts             # Process swipes
│   ├── swipe.route.ts
│   ├── swipe.schema.ts
│   └── index.ts
│
├── match/                           # Match management
│   ├── match.controller.ts
│   ├── match.service.ts             # Create/delete matches
│   ├── match.route.ts
│   ├── match.schema.ts
│   └── index.ts
│
├── location/                        # Geolocation
│   ├── location.controller.ts
│   ├── location.service.ts          # ⭐ Haversine + Bounding box
│   ├── location.route.ts
│   ├── location.schema.ts
│   └── index.ts
│
├── chat/                            # Dating chat
│   ├── dating-chat.controller.ts
│   ├── dating-chat.service.ts       # Messages + Socket
│   ├── dating-chat.route.ts
│   ├── dating-chat.schema.ts
│   └── index.ts
│
└── payment/                         # Premium & Payment
    ├── payment.controller.ts
    ├── payment.service.ts           # Transaction management
    ├── vnpay.service.ts             # ⭐ VNPay integration
    ├── vietqr.service.ts            # ⭐ VietQR generation
    ├── sepay.service.ts             # ⭐ Webhook handling
    ├── subscription.service.ts      # Tier management
    ├── payment.route.ts
    ├── payment.schema.ts
    └── index.ts
```

---

## 4. Luồng hoạt động chi tiết

### 4.1 User Journey Flow (Tổng quan hành trình người dùng)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[Người dùng mở app]
        │
        ▼
┌───────────────────┐     Chưa có profile     ┌─────────────────────────────┐
│  Check Profile    │ ──────────────────────▶ │     ONBOARDING FLOW         │
│  (API: /profile)  │                         │  (Xem mục 3.2)              │
└───────────────────┘                         └─────────────────────────────┘
        │ Đã có profile
        ▼
┌───────────────────┐
│  Dating Home      │
│  (Discovery)      │
└───────────────────┘
        │
        ├──────────────────┬──────────────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   SWIPE      │   │    LIKES     │   │   MATCHES    │   │   SETTINGS   │
│   FLOW       │   │    FLOW      │   │    FLOW      │   │    FLOW      │
│  (Mục 4.3)   │   │  (Mục 4.5)   │   │  (Mục 4.6)   │   │  (Mục 4.9)   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
        │                                     │
        │ Match thành công                    │
        ▼                                     ▼
┌───────────────────┐              ┌───────────────────┐
│  MATCH SUCCESS    │              │    CHAT FLOW      │
│  FLOW (Mục 4.4)   │─────────────▶│    (Mục 4.7)      │
└───────────────────┘              └───────────────────┘
```

---

### 4.2 Onboarding Flow (Đăng ký hồ sơ Dating)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONBOARDING FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

[User nhấn "Bắt đầu Dating"]
        │
        ▼
┌───────────────────────────────────────┐
│  Step 1: INTRO SCREEN                 │
│  ─────────────────────                │
│  - Giới thiệu tính năng               │
│  - Các quy tắc cộng đồng              │
│  - Nút "Tiếp tục"                     │
│                                       │
│  File: DatingOnboardingIntroScreen    │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 2: PROFILE SETUP                │
│  ─────────────────────                │
│  - Upload photos (tối thiểu 1)        │
│  - Nhập bio/giới thiệu                │
│  - Chọn interests (sở thích)          │
│  - Nhập prompts (câu hỏi gợi mở)      │
│  - Chọn looking for (mục đích)        │
│                                       │
│  File: DatingProfileSetupScreen       │
│  API: POST /api/v1/dating/profile     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 3: PREFERENCES SETUP            │
│  ─────────────────────────            │
│  - Chọn giới tính quan tâm            │
│  - Chọn khoảng tuổi (min-max)         │
│  - Chọn khoảng cách tối đa (km)       │
│  - Chọn ngành học ưu tiên             │
│  - Toggle: chỉ cùng khóa              │
│                                       │
│  File: DatingPreferencesSetupScreen   │
│  API: PUT /api/v1/dating/profile      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 4: LOCATION PERMISSION          │
│  ───────────────────────────          │
│  - Yêu cầu quyền truy cập vị trí      │
│  - Giải thích lý do cần vị trí        │
│  - Nếu từ chối: vẫn dùng được         │
│    nhưng không có tính năng distance  │
│                                       │
│  File: DatingLocationPermissionScreen │
│  API: POST /api/v1/dating/location    │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  HOÀN THÀNH ONBOARDING                │
│  ─────────────────────                │
│  - Navigate to Discovery Screen       │
│  - Profile isActive = true            │
└───────────────────────────────────────┘
```

**Validation Rules:**
- Photos: Tối thiểu 1, tối đa 6
- Bio: 10-500 ký tự
- Interests: Tối thiểu 3, tối đa 10
- Age range: 18-60

---

### 4.3 Swipe Flow (Like/Dislike/SuperLike)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SWIPE FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

[Discovery Screen hiển thị card stack]
        │
        ▼
┌───────────────────────────────────────┐
│  Load Feed                            │
│  ─────────                            │
│  Hook: useDiscoveryFeed()             │
│  API: GET /api/v1/dating/discovery    │
│                                       │
│  Backend thực hiện:                   │
│  1. Lấy preferences của user          │
│  2. Lọc candidates theo preferences   │
│  3. Tính score cho mỗi candidate      │
│  4. Sắp xếp theo score DESC           │
│  5. Trả về danh sách profiles         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  User thực hiện action                │
└───────────────────────────────────────┘
        │
        ├─────────────────┬─────────────────┬─────────────────┐
        ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  SWIPE LEFT │   │ SWIPE RIGHT │   │ SUPER LIKE  │   │   REWIND    │
│  (Dislike)  │   │   (Like)    │   │  (Premium)  │   │  (Premium)  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────────────────────────┐   ┌─────────────┐
│ POST /swipe │   │        POST /api/v1/dating/swipe │   │POST /rewind │
│ action:     │   │        action: LIKE/SUPER_LIKE   │   │             │
│ UNLIKE      │   └─────────────────────────────────┘   └─────────────┘
└─────────────┘                   │                           │
        │                         ▼                           │
        │           ┌─────────────────────────┐               │
        │           │  Check mutual like      │               │
        │           │  (Đối phương đã like?)  │               │
        │           └─────────────────────────┘               │
        │                    │          │                     │
        │              YES   │          │  NO                 │
        │                    ▼          ▼                     │
        │           ┌─────────────┐  ┌─────────────┐         │
        │           │ CREATE      │  │ Lưu swipe   │         │
        │           │ MATCH       │  │ record      │         │
        │           └─────────────┘  └─────────────┘         │
        │                    │                                │
        │                    ▼                                │
        │           ┌─────────────────────────┐               │
        │           │ - Send push notif       │               │
        │           │ - Emit socket event     │               │
        │           │ - Create conversation   │               │
        │           └─────────────────────────┘               │
        │                    │                                │
        ▼                    ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Hiển thị card tiếp theo                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Daily Limits:**
| Tier | Swipes | Super Likes | Rewinds |
|------|--------|-------------|---------|
| FREE | 50 | 1 | 0 |
| PREMIUM | Unlimited | 5 | Unlimited |

---

### 4.4 Match Success Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MATCH SUCCESS FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[Match được tạo từ Swipe Flow]
        │
        ▼
┌───────────────────────────────────────┐
│  Backend tạo Match                    │
│  ────────────────────                 │
│  1. Insert vào bảng DatingMatch       │
│  2. Tạo DatingConversation            │
│  3. Push notification cho cả 2        │
│  4. Emit socket: 'newMatch'           │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Frontend nhận event                  │
│  ─────────────────────                │
│  Hook: useDiscoveryFeed()             │
│  State: isMatched = true              │
│  State: matchedCard = profile data    │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  MATCH SUCCESS SCREEN                 │
│  ────────────────────                 │
│  File: MatchSuccessScreen.tsx         │
│                                       │
│  Hiển thị:                            │
│  - Animation confetti                 │
│  - Avatar cả 2 người                  │
│  - "It's a Match!"                    │
│  - Nút "Gửi tin nhắn"                 │
│  - Nút "Tiếp tục swipe"               │
└───────────────────────────────────────┘
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│  "Gửi tin nhắn"     │         │  "Tiếp tục swipe"   │
│  ─────────────      │         │  ────────────────   │
│  Navigate to        │         │  consumeMatch()     │
│  DatingChatRoom     │         │  Quay lại Discovery │
└─────────────────────┘         └─────────────────────┘
```

---

### 4.5 Likes Flow (Xem ai đã like mình)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LIKES FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

[User mở tab "Likes"]
        │
        ▼
┌───────────────────────────────────────┐
│  Check Subscription                   │
│  ──────────────────                   │
│  API: GET /subscription               │
│  Check: canSeeLikes                   │
└───────────────────────────────────────┘
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│  FREE USER          │         │  PREMIUM USER       │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│  API: GET /likes    │         │  API: GET /likes    │
│  ?blur=true         │         │  ?blur=false        │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Hiển thị grid      │         │  Hiển thị grid      │
│  với ảnh bị blur    │         │  ảnh rõ nét         │
│  ─────────────      │         │  ────────────       │
│  Nhấn vào card:     │         │  Nhấn vào card:     │
│  → Upsell Premium   │         │  → Xem profile      │
│                     │         │  → Like back        │
└─────────────────────┘         └─────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │  Like Back Action   │
                                │  ────────────────   │
                                │  POST /swipe        │
                                │  action: LIKE       │
                                │  → Tạo match ngay   │
                                └─────────────────────┘
```

---

### 4.6 Matches Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MATCHES FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

[User mở tab "Matches"]
        │
        ▼
┌───────────────────────────────────────┐
│  Load Matches                         │
│  ────────────                         │
│  API: GET /api/v1/dating/matches      │
│  File: DatingMatchListScreen.tsx      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Hiển thị danh sách matches           │
│  ────────────────────────             │
│  - Avatar + Tên                       │
│  - Thời gian match                    │
│  - Badge "New" nếu < 24h              │
│  - Phân loại:                         │
│    + New Matches (chưa nhắn tin)      │
│    + Active Chats (đã có conversation)│
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  User chọn một match                  │
└───────────────────────────────────────┘
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Xem Profile        │         │  Mở Chat            │
│  ────────────       │         │  ─────────          │
│  Navigate to        │         │  Navigate to        │
│  DatingProfileDetail│         │  DatingChatRoom     │
└─────────────────────┘         └─────────────────────┘
```

---

### 4.7 Chat Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               CHAT FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

[User mở DatingChatRoom]
        │
        ▼
┌───────────────────────────────────────┐
│  Initialize Chat                      │
│  ───────────────                      │
│  1. Get/Create conversation           │
│  2. Load messages history             │
│  3. Join socket room                  │
│  4. Mark messages as read             │
│                                       │
│  APIs:                                │
│  - GET /chat/conversations/:id        │
│  - GET /chat/messages/:conversationId │
│  - Socket: join conversation room     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Real-time Listeners                  │
│  ───────────────────                  │
│  Socket events:                       │
│  - 'newMessage' → add to list         │
│  - 'userTyping' → show indicator      │
│  - 'messageRead' → update status      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CHAT ACTIONS                                                      │
└───────────────────────────────────────────────────────────────────┘
        │
        ├─────────────┬─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Send Text   │ │ Send Image  │ │ Send Voice  │ │ View Profile│ │  Unmatch    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │             │             │             │
        ▼             ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│POST /message│ │Upload MinIO │ │Record audio │ │ GET /profile│ │DELETE /match│
│             │ │POST /message│ │Upload MinIO │ │             │ │             │
│             │ │type: IMAGE  │ │POST /message│ │             │ │             │
│             │ │             │ │type: VOICE  │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Optimistic Update          │
        │  ──────────────────         │
        │  1. Add temp message to UI  │
        │  2. POST to API             │
        │  3. Socket broadcast        │
        │  4. Replace temp with real  │
        └─────────────────────────────┘
```

**Message Flow Detail:**

```
[User A gửi tin nhắn]
        │
        ▼
┌──────────────────┐
│ Frontend User A  │
│ ───────────────  │
│ 1. Optimistic UI │
│ 2. POST /message │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Backend          │
│ ───────          │
│ 1. Save to DB    │
│ 2. Socket emit   │
│    'newMessage'  │
│ 3. Push notif    │
│    (if offline)  │
└──────────────────┘
        │
        ├──────────────────────────────┐
        ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ Socket → User A  │          │ Socket → User B  │
│ (confirm sent)   │          │ (new message)    │
└──────────────────┘          └──────────────────┘
```

---

### 4.8 Block/Unmatch Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOCK / UNMATCH FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  User Actions       │
                    └─────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
    ┌───────────────┐                   ┌───────────────┐
    │   UNMATCH     │                   │    BLOCK      │
    └───────────────┘                   └───────────────┘
            │                                   │
            ▼                                   ▼
    ┌───────────────────────┐           ┌───────────────────────┐
    │ Confirmation Dialog   │           │ Confirmation + Reason │
    │ "Bạn có chắc muốn     │           │ - Spam                │
    │  hủy kết nối?"        │           │ - Inappropriate       │
    │                       │           │ - Fake profile        │
    │                       │           │ - Harassment          │
    │                       │           │ - Other               │
    └───────────────────────┘           └───────────────────────┘
            │                                   │
            ▼                                   ▼
    ┌───────────────────────┐           ┌───────────────────────┐
    │ DELETE /matches/:id   │           │ POST /block           │
    │                       │           │ { userId, reason }    │
    └───────────────────────┘           └───────────────────────┘
            │                                   │
            ▼                                   ▼
    ┌───────────────────────┐           ┌───────────────────────┐
    │ Backend:              │           │ Backend:              │
    │ 1. Delete match       │           │ 1. Create block record│
    │ 2. Delete conversation│           │ 2. Delete match       │
    │ 3. Delete messages    │           │ 3. Delete conversation│
    │                       │           │ 4. Add to exclusion   │
    │                       │           │    list (discovery)   │
    └───────────────────────┘           └───────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ Navigate back       │
                    │ Refresh lists       │
                    └─────────────────────┘
```

**Unblock Flow:**

```
[Settings > Blocked Users]
        │
        ▼
┌───────────────────────────────────────┐
│  API: GET /blocked-users              │
│  File: DatingBlockedUsersScreen.tsx   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Hiển thị danh sách đã block          │
│  - Avatar + Tên                       │
│  - Nút "Unblock"                      │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  User nhấn "Unblock"                  │
│  API: DELETE /block/:userId           │
│  → Người đó có thể xuất hiện          │
│    lại trong discovery                │
└───────────────────────────────────────┘
```

---

### 4.9 Settings Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SETTINGS FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

[User mở Dating Settings]
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  SETTINGS SCREEN                                                   │
│  File: DatingSettingsScreen.tsx                                    │
└───────────────────────────────────────────────────────────────────┘
        │
        ├─────────────┬─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Edit Profile│ │ Preferences │ │ Subscription│ │ Blocked     │ │ Pause/Delete│
│             │ │             │ │             │ │ Users       │ │ Profile     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │             │             │             │
        ▼             ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Navigate to  │ │Navigate to  │ │Navigate to  │ │Navigate to  │ │ Action      │
│ProfileSetup │ │Preferences  │ │Subscription │ │BlockedUsers │ │ Dialog      │
│Screen       │ │Screen       │ │Screen       │ │Screen       │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                                                                        │
                                                    ┌───────────────────┴───────────────────┐
                                                    ▼                                       ▼
                                            ┌─────────────────┐                     ┌─────────────────┐
                                            │  PAUSE PROFILE  │                     │  DELETE PROFILE │
                                            │  ─────────────  │                     │  ────────────── │
                                            │  PUT /profile   │                     │  DELETE /profile│
                                            │  isActive: false│                     │                 │
                                            │                 │                     │  Xóa hoàn toàn: │
                                            │  Profile không  │                     │  - Profile      │
                                            │  hiển thị trong │                     │  - Photos       │
                                            │  discovery      │                     │  - Swipes       │
                                            │                 │                     │  - Matches      │
                                            │  Có thể resume  │                     │  - Messages     │
                                            │  bất cứ lúc nào │                     │                 │
                                            └─────────────────┘                     └─────────────────┘
```

---

### 4.10 Premium/Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PREMIUM UPGRADE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

[User gặp tính năng Premium-only]
        │
        │  Ví dụ: SuperLike, Rewind, See Likes
        ▼
┌───────────────────────────────────────┐
│  Navigate to DatingPremiumScreen      │
│  File: DatingPremiumScreen.tsx        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Hiển thị Premium Benefits            │
│  ─────────────────────────            │
│  - Unlimited swipes                   │
│  - 5 Super Likes/ngày                 │
│  - Unlimited Rewind                   │
│  - Xem ai đã like mình                │
│  - Ưu tiên hiển thị profile           │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Chọn gói                             │
│  ────────                             │
│  - 1 Tháng:  99,000đ                  │
│  - 3 Tháng: 249,000đ (tiết kiệm 16%)  │
│  - 1 Năm:   799,000đ (tiết kiệm 33%)  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Chọn phương thức thanh toán          │
└───────────────────────────────────────┘
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│     VNPAY           │         │     VIETQR          │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│ POST /vnpay/create  │         │ POST /vietqr/create │
│                     │         │                     │
│ Response:           │         │ Response:           │
│ { paymentUrl }      │         │ { qrUrl,            │
│                     │         │   transactionCode,  │
│                     │         │   amount,           │
│                     │         │   bankInfo }        │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│ Open WebView        │         │ Hiển thị QR Code    │
│ → VNPay Portal      │         │ trong app           │
│ → User nhập thẻ     │         │ → User mở app bank  │
│ → Xác nhận OTP      │         │ → Scan QR           │
│                     │         │ → Xác nhận          │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│ VNPay redirect to   │         │ SePay Webhook       │
│ /vnpay/return       │         │ POST /sepay/webhook │
│                     │         │                     │
│ - Verify signature  │         │ - Parse content     │
│ - Check amount      │         │ - Match transaction │
│ - Update status     │         │ - Verify amount     │
└─────────────────────┘         └─────────────────────┘
        │                                 │
        └─────────────────┬───────────────┘
                          ▼
                ┌─────────────────────┐
                │  Payment SUCCESS    │
                │  ─────────────────  │
                │  1. Update          │
                │     transaction     │
                │     status          │
                │  2. Update          │
                │     subscription    │
                │     tier: PREMIUM   │
                │  3. Set expiry date │
                └─────────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │  Navigate to        │
                │  PaymentResult      │
                │  Screen             │
                │  ─────────────────  │
                │  - Success message  │
                │  - New benefits     │
                │  - Expiry date      │
                └─────────────────────┘
```

---

### 4.11 Location Update Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCATION UPDATE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────┐
                    │   TRIGGER LOCATION UPDATE │
                    └───────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ App Launch    │     │ Discovery     │     │ Manual        │
│ (Background)  │     │ Screen Open   │     │ Refresh       │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────┐
                    │  Check Location Permission│
                    │  ─────────────────────────│
                    │  expo-location            │
                    │  requestForeground        │
                    │  PermissionsAsync()       │
                    └───────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌───────────────┐           ┌───────────────┐
        │   GRANTED     │           │    DENIED     │
        └───────────────┘           └───────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │ Get Current       │       │ Use last known    │
        │ Position          │       │ location or       │
        │ ─────────────     │       │ skip distance     │
        │ getCurrentPosition│       │ calculation       │
        │ Async()           │       │                   │
        └───────────────────┘       └───────────────────┘
                │
                ▼
        ┌───────────────────────────┐
        │  POST /location           │
        │  ─────────────            │
        │  {                        │
        │    latitude: number,      │
        │    longitude: number      │
        │  }                        │
        │                           │
        │  Backend:                 │
        │  - Update DatingProfile   │
        │  - Store coordinates      │
        │  - Update lastLocationAt  │
        └───────────────────────────┘
                │
                ▼
        ┌───────────────────────────┐
        │  Distance Calculation     │
        │  ────────────────────     │
        │  Khi load discovery feed, │
        │  tính khoảng cách từ      │
        │  user đến mỗi candidate   │
        │  bằng Haversine Formula   │
        └───────────────────────────┘
```

---

### 4.12 Discovery Feed Flow (Chi tiết)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DISCOVERY FEED FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

[GET /api/v1/dating/discovery]
        │
        ▼
┌───────────────────────────────────────┐
│  Step 1: Get Current User Profile     │
│  ─────────────────────────────────    │
│  - Load my DatingProfile              │
│  - Load my DatingPreferences          │
│  - Get my location (lat, lng)         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 2: Build Exclusion List         │
│  ─────────────────────────────        │
│  Không hiển thị:                      │
│  - Đã swipe (like/unlike)             │
│  - Đã match                           │
│  - Đã block (cả 2 chiều)              │
│  - Chính mình                         │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 3: Database Query (Filtering)   │
│  ───────────────────────────────────  │
│  WHERE:                               │
│  - isActive = true                    │
│  - photos.length >= 1                 │
│  - userId NOT IN exclusionList        │
│  - gender IN preferredGenders         │
│  - age BETWEEN ageMin AND ageMax      │
│  - (optional) major IN preferredMajors│
│  - (optional) year = myYear           │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 4: Fetch Candidate Pool         │
│  ─────────────────────────────        │
│  Lấy 5x số lượng yêu cầu              │
│  (minimum 50 profiles)                │
│  để có đủ data cho scoring            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 5: Calculate Scores             │
│  ─────────────────────────            │
│  Cho mỗi candidate:                   │
│  score = ageMatchScore (25)           │
│        + genderMatchScore (20)        │
│        + majorMatchScore (15)         │
│        + sameYearScore (15)           │
│        + profileCompletenessScore (15)│
│        + recentActivityScore (10)     │
│                                       │
│  (Xem chi tiết ở mục 5.1)             │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 6: Sort by Score                │
│  ─────────────────────                │
│  ORDER BY score DESC                  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 7: Pagination                   │
│  ─────────────────                    │
│  SKIP: (page - 1) * limit             │
│  TAKE: limit (default 10)             │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 8: Calculate Distances          │
│  ────────────────────────             │
│  Cho mỗi profile trong kết quả:       │
│  distance = haversine(                │
│    myLat, myLng,                      │
│    candidateLat, candidateLng         │
│  )                                    │
│                                       │
│  (Xem công thức ở mục 5.2)            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Step 9: Response                     │
│  ─────────────                        │
│  {                                    │
│    data: ProfileCard[],               │
│    pagination: {                      │
│      page, limit, total, hasMore      │
│    }                                  │
│  }                                    │
└───────────────────────────────────────┘
```

---

## 5. Thuật toán

### 5.1 Scoring Algorithm (Thuật toán tính điểm) - CHI TIẾT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCORING ALGORITHM                                    │
│                    Thuật toán xếp hạng profiles thông minh                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.1 Tổng quan

**Mục đích:** Sắp xếp profiles theo mức độ phù hợp với user, hiển thị người PHÙ HỢP NHẤT lên đầu.

**Tại sao cần thuật toán này?**
- Có hàng nghìn profiles trong hệ thống
- User không thể xem hết tất cả
- Cần ưu tiên hiển thị những người có khả năng match cao nhất

**File implementation:** `backend/src/modules/dating/discovery/scoring.service.ts`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TỔNG QUAN SCORING                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Input:  candidates[] + userPreferences                                    │
│  Output: candidates[] sorted by score DESC                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  TOTAL SCORE = Σ (factor_weight × factor_score)                    │   │
│  │                                                                     │   │
│  │  Với 6 factors:                                                    │   │
│  │  ┌─────────────────┬────────┬─────────────────────────────────┐   │   │
│  │  │ Factor          │ Weight │ Ý nghĩa                         │   │   │
│  │  ├─────────────────┼────────┼─────────────────────────────────┤   │   │
│  │  │ Age Match       │ 30     │ Tuổi phù hợp với preference     │   │   │
│  │  │ Gender Match    │ 20     │ Giới tính phù hợp               │   │   │
│  │  │ Major Match     │ 20     │ Ngành học phù hợp               │   │   │
│  │  │ Same Year       │ 10     │ Cùng khóa học                   │   │   │
│  │  │ Completeness    │ 10     │ Profile hoàn thiện              │   │   │
│  │  │ Activity        │ 10     │ Hoạt động gần đây               │   │   │
│  │  ├─────────────────┼────────┼─────────────────────────────────┤   │   │
│  │  │ TOTAL           │ 100    │                                 │   │   │
│  │  └─────────────────┴────────┴─────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Factor 1: Age Match Score (30 điểm)

**Ý tưởng:** Không chỉ check "trong khoảng hay không" mà còn tính điểm GRADIENT - càng gần center của khoảng tuổi càng được điểm cao.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGE MATCH SCORING                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CÔNG THỨC TOÁN HỌC:                                                       │
│  ═══════════════════                                                       │
│                                                                             │
│  Cho: ageMin, ageMax (từ user preferences)                                 │
│       candidateAge (tuổi của candidate)                                    │
│       W = 30 (weight của factor này)                                       │
│                                                                             │
│  Bước 1: Tính center và halfRange                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  center = (ageMin + ageMax) / 2                                     │   │
│  │  halfRange = (ageMax - ageMin) / 2                                  │   │
│  │  (nếu halfRange = 0, set halfRange = 1 để tránh chia 0)            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Bước 2: Tính khoảng cách từ candidateAge đến center                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  distFromCenter = |candidateAge - center|                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Bước 3: Tính score                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Nếu candidateAge < ageMin hoặc > ageMax:                          │   │
│  │      score = 0 (ngoài khoảng hoàn toàn)                            │   │
│  │                                                                     │   │
│  │  Ngược lại:                                                        │   │
│  │      score = W × (1 - distFromCenter / (halfRange + 1))            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

VÍ DỤ MINH HỌA:
═══════════════

User preferences: ageMin = 20, ageMax = 26
→ center = 23, halfRange = 3

                    Score Distribution
    30 ┤                  ████
       │                ██    ██
    25 ┤              ██        ██
       │            ██            ██
    20 ┤          ██                ██
       │        ██                    ██
    15 ┤      ██                        ██
       │    ██                            ██
    10 ┤  ██                                ██
       │██                                    ██
     5 ┤
       │
     0 ┼──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──
        18 19 20 21 22 23 24 25 26 27 28 29 30
                         Tuổi
                          ▲
                       center

Tính toán cụ thể:
┌───────────────┬──────────────────────────────────────────┬─────────┐
│ Candidate Age │ Công thức                                │ Score   │
├───────────────┼──────────────────────────────────────────┼─────────┤
│ 23 tuổi       │ 30 × (1 - 0/4) = 30 × 1.0               │ 30.0    │
│ 22 tuổi       │ 30 × (1 - 1/4) = 30 × 0.75              │ 22.5    │
│ 24 tuổi       │ 30 × (1 - 1/4) = 30 × 0.75              │ 22.5    │
│ 20 tuổi       │ 30 × (1 - 3/4) = 30 × 0.25              │ 7.5     │
│ 26 tuổi       │ 30 × (1 - 3/4) = 30 × 0.25              │ 7.5     │
│ 19 tuổi       │ Ngoài khoảng                            │ 0       │
│ 27 tuổi       │ Ngoài khoảng                            │ 0       │
└───────────────┴──────────────────────────────────────────┴─────────┘

EDGE CASES:
- Nếu candidate không có dateOfBirth → score = W × 0.5 (fallback)
- Nếu user không set ageMin/ageMax → dùng default 18-99
```

#### 5.1.3 Factor 2: Gender Match Score (20 điểm)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GENDER MATCH SCORING                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CÔNG THỨC:                                                                │
│  ══════════                                                                │
│                                                                             │
│  W = 20 (weight)                                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  if (userPreferences.gender === null):                             │   │
│  │      score = W × 0.5    // User không có preference, neutral       │   │
│  │                                                                     │   │
│  │  else if (candidateGender === userPreferences.gender):             │   │
│  │      score = W          // Match hoàn toàn                         │   │
│  │                                                                     │   │
│  │  else:                                                             │   │
│  │      score = 0          // Không match                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  User prefer: FEMALE                                               │   │
│  │                                                                     │   │
│  │  Candidate FEMALE → 20 điểm ✓                                      │   │
│  │  Candidate MALE   → 0 điểm  ✗                                      │   │
│  │  Candidate OTHER  → 0 điểm  ✗                                      │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────                         │   │
│  │                                                                     │   │
│  │  User prefer: null (không set)                                     │   │
│  │                                                                     │   │
│  │  Candidate FEMALE → 10 điểm (neutral)                              │   │
│  │  Candidate MALE   → 10 điểm (neutral)                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.4 Factor 3: Major Match Score (20 điểm)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MAJOR MATCH SCORING                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CÔNG THỨC:                                                                │
│  ══════════                                                                │
│                                                                             │
│  W = 20 (weight)                                                           │
│  preferredMajors[] = danh sách ngành user muốn tìm                        │
│  candidateEducation = ngành của candidate                                  │
│                                                                             │
│  PSEUDOCODE:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function scoreMajorMatch(candidateEducation, preferredMajors):    │   │
│  │                                                                     │   │
│  │      // Không set preference → neutral score                       │   │
│  │      if (preferredMajors.length === 0):                            │   │
│  │          return W × 0.5                                            │   │
│  │                                                                     │   │
│  │      // Candidate không có education info                          │   │
│  │      if (candidateEducation === null):                             │   │
│  │          return 0                                                  │   │
│  │                                                                     │   │
│  │      // Check match (case-insensitive, partial match)              │   │
│  │      eduLower = candidateEducation.toLowerCase()                   │   │
│  │                                                                     │   │
│  │      for each major in preferredMajors:                            │   │
│  │          if (eduLower.includes(major.toLowerCase())):              │   │
│  │              return W   // Full match                              │   │
│  │                                                                     │   │
│  │      return W × 0.1     // Weak match (khác ngành)                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  User preferredMajors: ["CNTT", "ATTT"]                            │   │
│  │                                                                     │   │
│  │  Candidate "Công nghệ thông tin"  → 20 điểm (match "CNTT")         │   │
│  │  Candidate "An toàn thông tin"    → 20 điểm (match "ATTT")         │   │
│  │  Candidate "Quản trị kinh doanh"  → 2 điểm  (weak match)           │   │
│  │  Candidate null (không có info)   → 0 điểm                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TẠI SAO DÙNG PARTIAL MATCH?                                               │
│  - "CNTT" có thể match "Công nghệ thông tin", "cntt", "CNTT-K65"         │
│  - Linh hoạt hơn exact match                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.5 Factor 4: Same Year Score (10 điểm)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SAME YEAR SCORING                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ý TƯỞNG:                                                                  │
│  - Sinh viên cùng khóa thường có nhiều điểm chung hơn                     │
│  - Extract năm từ studentId (VD: B21DCCN123 → 21 → năm 2021)              │
│                                                                             │
│  EXTRACT ACADEMIC YEAR:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Pattern: /[A-Z](\d{2})/                                           │   │
│  │                                                                     │   │
│  │  "B21DCCN123" → match[1] = "21" → year = 21                        │   │
│  │  "D20CNTT456" → match[1] = "20" → year = 20                        │   │
│  │  "N19ATTT789" → match[1] = "19" → year = 19                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CÔNG THỨC:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  W = 10 (weight)                                                   │   │
│  │  myYear = extractYear(myStudentId)                                 │   │
│  │  theirYear = extractYear(candidateStudentId)                       │   │
│  │                                                                     │   │
│  │  // Nếu user bật "chỉ cùng khóa"                                   │   │
│  │  if (sameYearOnly === true):                                       │   │
│  │      if (myYear === theirYear): return W                           │   │
│  │      else: return 0                                                │   │
│  │                                                                     │   │
│  │  // Nếu user không bật strict mode                                 │   │
│  │  if (sameYearOnly === false):                                      │   │
│  │      return W × 0.5    // Neutral, không ưu tiên                   │   │
│  │                                                                     │   │
│  │  // Nếu thiếu data                                                 │   │
│  │  if (myYear === null || theirYear === null):                       │   │
│  │      return W × 0.3    // Fallback                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  User: B21DCCN123 (khóa 21), sameYearOnly = true                   │   │
│  │                                                                     │   │
│  │  Candidate B21ATTT456 (khóa 21) → 10 điểm ✓                        │   │
│  │  Candidate D20CNTT789 (khóa 20) → 0 điểm  ✗                        │   │
│  │  Candidate N22QTKD012 (khóa 22) → 0 điểm  ✗                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.6 Factor 5: Profile Completeness Score (10 điểm)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROFILE COMPLETENESS SCORING                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ý TƯỞNG:                                                                  │
│  - Profile đầy đủ = user nghiêm túc, có nhiều info để quyết định          │
│  - Khuyến khích users hoàn thiện profile                                  │
│                                                                             │
│  CÁC COMPONENT VÀ TRỌNG SỐ:                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────────────────────────┬────────────────┬───────────────────┐ │   │
│  │  │ Component                │ Điều kiện      │ Điểm (% of 100%)  │ │   │
│  │  ├──────────────────────────┼────────────────┼───────────────────┤ │   │
│  │  │ Photos (tốt)             │ ≥ 3 ảnh        │ +40%              │ │   │
│  │  │ Photos (tối thiểu)       │ ≥ 1 ảnh        │ +20%              │ │   │
│  │  │ Bio (tốt)                │ ≥ 20 ký tự     │ +30%              │ │   │
│  │  │ Bio (có)                 │ > 0 ký tự      │ +10%              │ │   │
│  │  │ Education                │ có giá trị     │ +15%              │ │   │
│  │  │ Full Name                │ có giá trị     │ +15%              │ │   │
│  │  └──────────────────────────┴────────────────┴───────────────────┘ │   │
│  │                                                                     │   │
│  │  Tổng tối đa: 100%                                                 │   │
│  │  Score = completeness% × W (với W = 10)                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PSEUDOCODE:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function scoreProfileCompleteness(candidate):                     │   │
│  │      completeness = 0                                              │   │
│  │      W = 10                                                        │   │
│  │                                                                     │   │
│  │      // Photos                                                     │   │
│  │      if (candidate.photos.length >= 3):                            │   │
│  │          completeness += 0.40                                      │   │
│  │      else if (candidate.photos.length >= 1):                       │   │
│  │          completeness += 0.20                                      │   │
│  │                                                                     │   │
│  │      // Bio                                                        │   │
│  │      if (candidate.bio && candidate.bio.length >= 20):             │   │
│  │          completeness += 0.30                                      │   │
│  │      else if (candidate.bio):                                      │   │
│  │          completeness += 0.10                                      │   │
│  │                                                                     │   │
│  │      // Education                                                  │   │
│  │      if (candidate.lifestyle?.education):                          │   │
│  │          completeness += 0.15                                      │   │
│  │                                                                     │   │
│  │      // Full Name                                                  │   │
│  │      if (candidate.user.fullName):                                 │   │
│  │          completeness += 0.15                                      │   │
│  │                                                                     │   │
│  │      // Cap at 100%                                                │   │
│  │      return W × min(completeness, 1.0)                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ TÍNH TOÁN:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Candidate A:                                                      │   │
│  │  - 4 ảnh         → +40%                                            │   │
│  │  - Bio 50 ký tự  → +30%                                            │   │
│  │  - Có education  → +15%                                            │   │
│  │  - Có fullName   → +15%                                            │   │
│  │  ─────────────────────────                                         │   │
│  │  Total: 100% → Score = 10 × 1.0 = 10 điểm                          │   │
│  │                                                                     │   │
│  │  ─────────────────────────────────────────────────────────────     │   │
│  │                                                                     │   │
│  │  Candidate B:                                                      │   │
│  │  - 1 ảnh         → +20%                                            │   │
│  │  - Bio 10 ký tự  → +10%                                            │   │
│  │  - Không có edu  → +0%                                             │   │
│  │  - Có fullName   → +15%                                            │   │
│  │  ─────────────────────────                                         │   │
│  │  Total: 45% → Score = 10 × 0.45 = 4.5 điểm                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.7 Factor 6: Recent Activity Score (10 điểm)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY SCORING (Time Decay Function)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ý TƯỞNG:                                                                  │
│  - User active = có khả năng respond cao hơn                              │
│  - Tránh hiện "ghost profiles" (tài khoản bỏ hoang)                       │
│  - Dùng TIME DECAY: càng lâu không active, điểm càng giảm                 │
│                                                                             │
│  DECAY CURVE:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Score                                                              │   │
│  │   10 ┤████████                                                      │   │
│  │      │        ████                                                  │   │
│  │    7 ┤            ████████                                          │   │
│  │      │                    ████                                      │   │
│  │    4 ┤                        ████████████                          │   │
│  │      │                                    ████                      │   │
│  │    2 ┤                                        ████████████████      │   │
│  │      │                                                        ████  │   │
│  │    0 ┼────┬────┬────┬────┬────┬────┬────┬────┬────┬────────────────│   │
│  │      0   1h  24h  48h  72h  96h 120h 144h 168h    > 168h           │   │
│  │          │         │              │                    │            │   │
│  │        1 giờ    3 ngày        7 ngày              > 7 ngày          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CÔNG THỨC:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  W = 10 (weight)                                                   │   │
│  │  hoursSinceActive = (now - lastActiveAt) / (1000 × 60 × 60)       │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────┬─────────────┬──────────────────────┐ │   │
│  │  │ Thời gian inactive       │ Decay Rate  │ Score                │ │   │
│  │  ├──────────────────────────┼─────────────┼──────────────────────┤ │   │
│  │  │ ≤ 1 giờ (recent)         │ 1.0         │ 10 × 1.0 = 10        │ │   │
│  │  │ ≤ 24 giờ (today)         │ 0.7         │ 10 × 0.7 = 7         │ │   │
│  │  │ ≤ 72 giờ (3 ngày)        │ 0.4         │ 10 × 0.4 = 4         │ │   │
│  │  │ ≤ 168 giờ (7 ngày)       │ 0.2         │ 10 × 0.2 = 2         │ │   │
│  │  │ > 168 giờ (> 7 ngày)     │ 0.0         │ 10 × 0.0 = 0         │ │   │
│  │  └──────────────────────────┴─────────────┴──────────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PSEUDOCODE:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function scoreRecentActivity(lastActiveAt):                       │   │
│  │      W = 10                                                        │   │
│  │                                                                     │   │
│  │      if (lastActiveAt === null):                                   │   │
│  │          return 0                                                  │   │
│  │                                                                     │   │
│  │      hoursSince = (Date.now() - lastActiveAt) / 3600000           │   │
│  │                                                                     │   │
│  │      if (hoursSince <= 1):   return W × 1.0   // 10 điểm          │   │
│  │      if (hoursSince <= 24):  return W × 0.7   // 7 điểm           │   │
│  │      if (hoursSince <= 72):  return W × 0.4   // 4 điểm           │   │
│  │      if (hoursSince <= 168): return W × 0.2   // 2 điểm           │   │
│  │      return 0                                  // 0 điểm           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TẠI SAO DÙNG STEP FUNCTION THAY VÌ CONTINUOUS DECAY?                      │
│  - Đơn giản hơn để implement và debug                                     │
│  - Dễ explain cho stakeholders                                            │
│  - Performance tốt hơn (không cần tính exponential)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.8 Tổng hợp và Sắp xếp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FINAL SCORING & SORTING                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PSEUDOCODE TỔNG HỢP:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function scoreCandidates(candidates[], context):                  │   │
│  │      { preferences, myStudentId } = context                        │   │
│  │                                                                     │   │
│  │      // Nếu không có preferences, trả về unsorted                  │   │
│  │      if (preferences === null):                                    │   │
│  │          return candidates.map(c => ({ ...c, score: 0 }))         │   │
│  │                                                                     │   │
│  │      // Tính score cho mỗi candidate                               │   │
│  │      scoredCandidates = candidates.map(candidate => {              │   │
│  │          score =                                                   │   │
│  │              scoreAgeMatch(candidate.dob, preferences)             │   │
│  │            + scoreGenderMatch(candidate.gender, preferences)       │   │
│  │            + scoreMajorMatch(candidate.education, prefs.majors)    │   │
│  │            + scoreSameYear(candidate.studentId, myStudentId, ...)  │   │
│  │            + scoreProfileCompleteness(candidate)                   │   │
│  │            + scoreRecentActivity(candidate.lastActiveAt)           │   │
│  │                                                                     │   │
│  │          return { ...candidate, score }                            │   │
│  │      })                                                            │   │
│  │                                                                     │   │
│  │      // Sort by score DESC                                         │   │
│  │      return scoredCandidates.sort((a, b) => b.score - a.score)    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VÍ DỤ THỰC TẾ:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  User: Nam, 22 tuổi, B21DCCN, prefer Nữ 20-25 tuổi, CNTT          │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │ Candidate A                                                │    │   │
│  │  │ Nữ, 22 tuổi, B21ATTT, online 30 phút, 4 ảnh, bio đầy đủ   │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ Age:    30 × (1 - 0/4) = 30.0                             │    │   │
│  │  │ Gender: 20 (match)                                        │    │   │
│  │  │ Major:  20 × 0.1 = 2.0 (ATTT ≠ CNTT, weak match)          │    │   │
│  │  │ Year:   10 (cùng B21)                                     │    │   │
│  │  │ Profile: 10 × 1.0 = 10.0 (đầy đủ)                         │    │   │
│  │  │ Activity: 10 × 1.0 = 10.0 (online < 1h)                   │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ TOTAL: 82.0 điểm                                          │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │ Candidate B                                                │    │   │
│  │  │ Nữ, 25 tuổi, D20CNTT, online 2 ngày, 2 ảnh, bio ngắn      │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ Age:    30 × (1 - 2.5/4) = 11.25                          │    │   │
│  │  │ Gender: 20 (match)                                        │    │   │
│  │  │ Major:  20 (CNTT match)                                   │    │   │
│  │  │ Year:   10 × 0.5 = 5.0 (sameYearOnly=false)               │    │   │
│  │  │ Profile: 10 × 0.45 = 4.5                                  │    │   │
│  │  │ Activity: 10 × 0.4 = 4.0 (online < 72h)                   │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ TOTAL: 64.75 điểm                                         │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │ Candidate C                                                │    │   │
│  │  │ Nữ, 28 tuổi, N19QTKD, offline 10 ngày, 1 ảnh, không bio   │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ Age:    0 (ngoài khoảng 20-25)                            │    │   │
│  │  │ Gender: 20 (match)                                        │    │   │
│  │  │ Major:  20 × 0.1 = 2.0 (QTKD weak match)                  │    │   │
│  │  │ Year:   10 × 0.5 = 5.0                                    │    │   │
│  │  │ Profile: 10 × 0.35 = 3.5                                  │    │   │
│  │  │ Activity: 0 (offline > 7 ngày)                            │    │   │
│  │  ├────────────────────────────────────────────────────────────┤    │   │
│  │  │ TOTAL: 30.5 điểm                                          │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │  KẾT QUẢ SAU KHI SORT:                                             │   │
│  │  1. Candidate A: 82.0 điểm  ← Hiển thị đầu tiên                   │   │
│  │  2. Candidate B: 64.75 điểm                                        │   │
│  │  3. Candidate C: 30.5 điểm                                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.9 Cấu hình và Điều chỉnh

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCORING CONFIGURATION                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tất cả weights và thresholds được định nghĩa trong CONFIG:                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  const SCORING_CONFIG = {                                          │   │
│  │                                                                     │   │
│  │    // Trọng số cho mỗi factor (tổng = 100)                         │   │
│  │    weights: {                                                      │   │
│  │      ageMatch: 30,                                                 │   │
│  │      genderMatch: 20,                                              │   │
│  │      majorMatch: 20,                                               │   │
│  │      sameYear: 10,                                                 │   │
│  │      profileCompleteness: 10,                                      │   │
│  │      recentActivity: 10,                                           │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │    // Fallback scores khi thiếu data                               │   │
│  │    fallback: {                                                     │   │
│  │      noPref: 0.5,    // User không set preference                  │   │
│  │      noData: 0.3,    // Candidate thiếu data                       │   │
│  │      weakMatch: 0.1, // Match yếu                                  │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │    // Thresholds cho profile completeness                          │   │
│  │    completeness: {                                                 │   │
│  │      photosGood: 3,        // Số ảnh "tốt"                         │   │
│  │      photosMin: 1,         // Số ảnh tối thiểu                     │   │
│  │      bioGoodLength: 20,    // Độ dài bio "tốt"                     │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │    // Thresholds cho activity decay (hours)                        │   │
│  │    activity: {                                                     │   │
│  │      recentHours: 1,                                               │   │
│  │      dayHours: 24,                                                 │   │
│  │      threeDaysHours: 72,                                           │   │
│  │      weekHours: 168,                                               │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │  };                                                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LỢI ÍCH CỦA VIỆC DÙNG CONFIG:                                            │
│  - Dễ dàng A/B test các trọng số khác nhau                               │
│  - Không cần sửa code khi muốn điều chỉnh                                 │
│  - Có thể load từ database hoặc remote config                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Haversine Formula (Tính khoảng cách) - CHI TIẾT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HAVERSINE FORMULA                                    │
│              Tính khoảng cách giữa 2 điểm trên bề mặt Trái Đất             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.1 Tại sao cần Haversine?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VẤN ĐỀ                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trái Đất là HÌNH CẦU, không phải mặt phẳng!                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Công thức Pythagoras (SAI trên mặt cầu):                          │   │
│  │                                                                     │   │
│  │  d = √[(x2-x1)² + (y2-y1)²]                                        │   │
│  │                                                                     │   │
│  │  → Chỉ đúng trên mặt phẳng                                         │   │
│  │  → SAI khi tính khoảng cách trên Trái Đất                          │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │                    🌍                                               │   │
│  │                  /    \                                             │   │
│  │                 /      \  ← Đường cong trên mặt cầu                │   │
│  │          A ●───────────● B                                         │   │
│  │                \      /                                             │   │
│  │                 \    /                                              │   │
│  │                  \  /                                               │   │
│  │                                                                     │   │
│  │  Khoảng cách thực tế đi theo ĐƯỜNG CONG (great circle)             │   │
│  │  không phải đường thẳng xuyên qua Trái Đất                         │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Công thức Haversine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CÔNG THỨC TOÁN HỌC                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Cho 2 điểm:                                                               │
│  - Điểm 1: (lat1, lng1) - vĩ độ, kinh độ (độ)                             │
│  - Điểm 2: (lat2, lng2) - vĩ độ, kinh độ (độ)                             │
│                                                                             │
│  BƯỚC 1: Chuyển đổi sang Radian                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  φ1 = lat1 × (π / 180)     // vĩ độ điểm 1 (radian)               │   │
│  │  φ2 = lat2 × (π / 180)     // vĩ độ điểm 2 (radian)               │   │
│  │  λ1 = lng1 × (π / 180)     // kinh độ điểm 1 (radian)             │   │
│  │  λ2 = lng2 × (π / 180)     // kinh độ điểm 2 (radian)             │   │
│  │                                                                     │   │
│  │  Δφ = φ2 - φ1              // chênh lệch vĩ độ                     │   │
│  │  Δλ = λ2 - λ1              // chênh lệch kinh độ                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 2: Tính giá trị trung gian 'a' (haversine)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)                  │   │
│  │                                                                     │   │
│  │  Giải thích:                                                       │   │
│  │  - sin²(Δφ/2): đóng góp từ chênh lệch vĩ độ                       │   │
│  │  - cos(φ1) × cos(φ2): hệ số hiệu chỉnh theo vĩ độ                 │   │
│  │  - sin²(Δλ/2): đóng góp từ chênh lệch kinh độ                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 3: Tính góc tâm 'c' (central angle)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  c = 2 × atan2(√a, √(1-a))                                         │   │
│  │                                                                     │   │
│  │  Giải thích:                                                       │   │
│  │  - atan2: hàm arctangent 2 tham số (tránh division by zero)       │   │
│  │  - c là góc (radian) tại tâm Trái Đất                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 4: Tính khoảng cách                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  distance = R × c                                                  │   │
│  │                                                                     │   │
│  │  Với R = 6371 km (bán kính trung bình của Trái Đất)               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Ví dụ tính toán chi tiết

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VÍ DỤ: Tính khoảng cách Hà Nội → Mỹ Đình                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Điểm 1 (Hà Nội):  lat1 = 21.0285°, lng1 = 105.8542°                      │
│  Điểm 2 (Mỹ Đình): lat2 = 21.0380°, lng2 = 105.7820°                      │
│                                                                             │
│  BƯỚC 1: Chuyển sang Radian                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  φ1 = 21.0285 × (π/180) = 0.36697 rad                              │   │
│  │  φ2 = 21.0380 × (π/180) = 0.36714 rad                              │   │
│  │  λ1 = 105.8542 × (π/180) = 1.84775 rad                             │   │
│  │  λ2 = 105.7820 × (π/180) = 1.84649 rad                             │   │
│  │                                                                     │   │
│  │  Δφ = 0.36714 - 0.36697 = 0.00017 rad                              │   │
│  │  Δλ = 1.84649 - 1.84775 = -0.00126 rad                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 2: Tính 'a'                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  sin²(Δφ/2) = sin²(0.000085) = 0.0000000072                        │   │
│  │  cos(φ1) = cos(0.36697) = 0.9333                                   │   │
│  │  cos(φ2) = cos(0.36714) = 0.9333                                   │   │
│  │  sin²(Δλ/2) = sin²(-0.00063) = 0.000000397                         │   │
│  │                                                                     │   │
│  │  a = 0.0000000072 + 0.9333 × 0.9333 × 0.000000397                  │   │
│  │    = 0.0000000072 + 0.000000346                                    │   │
│  │    = 0.000000353                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 3: Tính 'c'                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  √a = 0.000594                                                     │   │
│  │  √(1-a) = 0.999999823                                              │   │
│  │                                                                     │   │
│  │  c = 2 × atan2(0.000594, 0.999999823)                              │   │
│  │    = 2 × 0.000594                                                  │   │
│  │    = 0.001188 rad                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BƯỚC 4: Tính khoảng cách                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  distance = 6371 × 0.001188                                        │   │
│  │           = 7.57 km                                                │   │
│  │                                                                     │   │
│  │  → Khoảng cách Hà Nội - Mỹ Đình ≈ 7.5 km ✓                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Tối ưu hóa trong SQL (Bounding Box)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TỐI ƯU HÓA VỚI BOUNDING BOX                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VẤN ĐỀ: Tính Haversine cho 10,000 users rất chậm!                        │
│                                                                             │
│  GIẢI PHÁP: Pre-filter với Bounding Box trước                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  maxDistance = 50 km                                               │   │
│  │                                                                     │   │
│  │  // 1 độ latitude ≈ 111 km                                         │   │
│  │  latDelta = maxDistance / 111 = 0.45°                              │   │
│  │                                                                     │   │
│  │  // 1 độ longitude phụ thuộc vĩ độ                                 │   │
│  │  lngDelta = maxDistance / (111 × cos(myLat)) ≈ 0.48°               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BOUNDING BOX:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │     myLat + latDelta  ┌─────────────────────────┐                  │   │
│  │                       │                         │                  │   │
│  │                       │    ●───────────────●    │  Users trong box │   │
│  │                       │      ╱         ╲        │  → Check tiếp   │   │
│  │                       │    ╱   (myLat,   ╲      │                  │   │
│  │                       │   ╱     myLng)    ╲     │                  │   │
│  │                       │   ╲      ●        ╱     │  50km radius    │   │
│  │                       │    ╲             ╱      │                  │   │
│  │                       │      ╲         ╱        │                  │   │
│  │                       │        ───────          │                  │   │
│  │     myLat - latDelta  └─────────────────────────┘                  │   │
│  │                       │                         │                  │   │
│  │               myLng - lngDelta     myLng + lngDelta                │   │
│  │                                                                     │   │
│  │  ● Users ngoài box → Loại ngay (không cần Haversine)              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SQL QUERY:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  WITH nearby AS (                                                  │   │
│  │    SELECT                                                          │   │
│  │      *,                                                            │   │
│  │      (6371 * acos(                                                 │   │
│  │        LEAST(1.0, GREATEST(-1.0,                                   │   │
│  │          cos(radians(myLat)) * cos(radians(lat))                   │   │
│  │          * cos(radians(lng) - radians(myLng))                      │   │
│  │          + sin(radians(myLat)) * sin(radians(lat))                 │   │
│  │        ))                                                          │   │
│  │      )) AS distance                                                │   │
│  │    FROM DatingProfile                                              │   │
│  │    WHERE                                                           │   │
│  │      -- Bounding box pre-filter (RẤT NHANH)                        │   │
│  │      lat BETWEEN myLat - latDelta AND myLat + latDelta             │   │
│  │      AND lng BETWEEN myLng - lngDelta AND myLng + lngDelta         │   │
│  │  )                                                                 │   │
│  │  SELECT * FROM nearby                                              │   │
│  │  WHERE distance <= 50  -- Exact filter                             │   │
│  │  ORDER BY distance ASC                                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  HIỆU QUẢ:                                                                 │
│  - Bounding box loại bỏ ~90% candidates ngay lập tức                      │
│  - Haversine chỉ tính cho ~10% còn lại                                    │
│  - Tốc độ tăng 10-20x!                                                    │
│                                                                             │
│  NUMERIC STABILITY:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  LEAST(1.0, GREATEST(-1.0, ...))                                   │   │
│  │                                                                     │   │
│  │  Tại sao cần?                                                      │   │
│  │  - acos() chỉ nhận input trong khoảng [-1, 1]                      │   │
│  │  - Floating point errors có thể tạo ra 1.0000001                   │   │
│  │  - CLAMP để tránh NaN/Infinity errors                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Daily Limit Reset Algorithm - CHI TIẾT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DAILY LIMIT SYSTEM                                      │
│                Hệ thống giới hạn hành động theo ngày                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.1 Mục đích

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TẠI SAO CẦN DAILY LIMITS?                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MONETIZATION                                                           │
│     - FREE users có giới hạn → khuyến khích upgrade Premium               │
│     - Premium = unlimited → giá trị rõ ràng                               │
│                                                                             │
│  2. CHỐNG SPAM                                                             │
│     - Ngăn users swipe liên tục vô tội vạ                                 │
│     - Khuyến khích suy nghĩ kỹ trước khi like                             │
│                                                                             │
│  3. UX TỐT HƠN                                                             │
│     - Tránh "swipe fatigue"                                               │
│     - Users quay lại mỗi ngày để có thêm swipes                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Cấu trúc Limits

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUBSCRIPTION TIERS & LIMITS                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  const SUBSCRIPTION_LIMITS = {                                     │   │
│  │                                                                     │   │
│  │    FREE: {                                                         │   │
│  │      dailySwipes: 50,         // 50 swipes/ngày                    │   │
│  │      dailySuperLikes: 1,      // 1 super like/ngày                 │   │
│  │      dailyRewinds: 0,         // Không có rewind                   │   │
│  │      canSeeLikes: false,      // Không xem được ai like mình       │   │
│  │      canSeeWhoLikedYou: false,                                     │   │
│  │      canRewind: false,                                             │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │    PREMIUM: {                                                      │   │
│  │      dailySwipes: -1,         // -1 = unlimited                    │   │
│  │      dailySuperLikes: 5,      // 5 super likes/ngày                │   │
│  │      dailyRewinds: -1,        // Unlimited rewinds                 │   │
│  │      canSeeLikes: true,       // Xem được ai like mình             │   │
│  │      canSeeWhoLikedYou: true,                                      │   │
│  │      canRewind: true,                                              │   │
│  │    },                                                              │   │
│  │                                                                     │   │
│  │  };                                                                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SO SÁNH:                                                                  │
│  ┌───────────────────┬─────────────┬─────────────┐                        │
│  │ Feature           │ FREE        │ PREMIUM     │                        │
│  ├───────────────────┼─────────────┼─────────────┤                        │
│  │ Daily Swipes      │ 50          │ Unlimited   │                        │
│  │ Daily Super Likes │ 1           │ 5           │                        │
│  │ Daily Rewinds     │ 0           │ Unlimited   │                        │
│  │ See Likes         │ ❌ (blur)    │ ✅           │                        │
│  │ Rewind            │ ❌           │ ✅           │                        │
│  └───────────────────┴─────────────┴─────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.3 Daily Reset Mechanism

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DAILY RESET CRON JOB                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CRON SCHEDULE: 0 0 * * * (00:00 UTC mỗi ngày)                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Timeline:                                                         │   │
│  │                                                                     │   │
│  │  Day 1                         Day 2                         Day 3 │   │
│  │  ──────                        ──────                        ────  │   │
│  │  │                             │                             │     │   │
│  │  │  User swipes 30             │  RESET!                     │     │   │
│  │  │  count = 30                 │  count = 0                  │     │   │
│  │  │                             │                             │     │   │
│  │  │  User swipes 20 more        │  User starts fresh          │     │   │
│  │  │  count = 50                 │  count = 0                  │     │   │
│  │  │                             │                             │     │   │
│  │  │  BLOCKED!                   │  Can swipe 50 again         │     │   │
│  │  │  "Bạn đã hết lượt swipe"    │                             │     │   │
│  │  │                             │                             │     │   │
│  │  └─────────────────────────────┴─────────────────────────────┴     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SQL RESET QUERY:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  -- Chạy lúc 00:00 UTC mỗi ngày                                    │   │
│  │  UPDATE "DatingUsage"                                              │   │
│  │  SET                                                               │   │
│  │    "dailySwipeCount" = 0,                                          │   │
│  │    "dailySuperLikeCount" = 0,                                      │   │
│  │    "dailyRewindCount" = 0,                                         │   │
│  │    "lastResetAt" = NOW()                                           │   │
│  │  WHERE                                                             │   │
│  │    DATE("lastResetAt") < CURRENT_DATE;                             │   │
│  │                                                                     │   │
│  │  -- Chỉ reset những records chưa reset hôm nay                     │   │
│  │  -- Tránh reset 2 lần nếu cron chạy lại                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.4 Check Limit Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHECK LIMIT FLOW                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mỗi khi user thực hiện action (swipe, super like, rewind):               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  function checkAndUpdateLimit(userId, actionType):                 │   │
│  │                                                                     │   │
│  │      // 1. Lấy subscription tier                                   │   │
│  │      subscription = getSubscription(userId)                        │   │
│  │      tier = subscription?.tier ?? 'FREE'                           │   │
│  │      limits = SUBSCRIPTION_LIMITS[tier]                            │   │
│  │                                                                     │   │
│  │      // 2. Lấy usage hiện tại                                      │   │
│  │      usage = getOrCreateUsage(userId)                              │   │
│  │                                                                     │   │
│  │      // 3. Check nếu cần reset (qua ngày mới)                      │   │
│  │      if (isNewDay(usage.lastResetAt)):                             │   │
│  │          resetUsage(usage)                                         │   │
│  │                                                                     │   │
│  │      // 4. Check limit theo action type                            │   │
│  │      switch (actionType):                                          │   │
│  │                                                                     │   │
│  │          case 'SWIPE':                                             │   │
│  │              limit = limits.dailySwipes                            │   │
│  │              current = usage.dailySwipeCount                       │   │
│  │              field = 'dailySwipeCount'                             │   │
│  │                                                                     │   │
│  │          case 'SUPER_LIKE':                                        │   │
│  │              limit = limits.dailySuperLikes                        │   │
│  │              current = usage.dailySuperLikeCount                   │   │
│  │              field = 'dailySuperLikeCount'                         │   │
│  │                                                                     │   │
│  │          case 'REWIND':                                            │   │
│  │              if (!limits.canRewind):                               │   │
│  │                  throw Error('Upgrade to Premium')                 │   │
│  │              limit = limits.dailyRewinds                           │   │
│  │              current = usage.dailyRewindCount                      │   │
│  │              field = 'dailyRewindCount'                            │   │
│  │                                                                     │   │
│  │      // 5. Check if exceeded                                       │   │
│  │      if (limit !== -1 && current >= limit):                        │   │
│  │          throw Error('Daily limit reached')                        │   │
│  │                                                                     │   │
│  │      // 6. Increment counter                                       │   │
│  │      incrementUsage(userId, field)                                 │   │
│  │                                                                     │   │
│  │      return { remaining: limit === -1 ? 'unlimited' : limit - current - 1 }│
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.3.5 Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATABASE SCHEMA                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Table: DatingUsage                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌────────────────────┬──────────────┬───────────────────────────┐ │   │
│  │  │ Column             │ Type         │ Description               │ │   │
│  │  ├────────────────────┼──────────────┼───────────────────────────┤ │   │
│  │  │ id                 │ UUID         │ Primary key               │ │   │
│  │  │ userId             │ UUID         │ FK → User                 │ │   │
│  │  │ dailySwipeCount    │ INT          │ Số swipes hôm nay         │ │   │
│  │  │ dailySuperLikeCount│ INT          │ Số super likes hôm nay    │ │   │
│  │  │ dailyRewindCount   │ INT          │ Số rewinds hôm nay        │ │   │
│  │  │ lastResetAt        │ TIMESTAMP    │ Lần reset cuối            │ │   │
│  │  │ createdAt          │ TIMESTAMP    │ Ngày tạo                  │ │   │
│  │  │ updatedAt          │ TIMESTAMP    │ Ngày cập nhật             │ │   │
│  │  └────────────────────┴──────────────┴───────────────────────────┘ │   │
│  │                                                                     │   │
│  │  Indexes:                                                          │   │
│  │  - UNIQUE(userId) - mỗi user chỉ có 1 record usage                │   │
│  │  - INDEX(lastResetAt) - để cron job chạy nhanh                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Table: DatingSubscription                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌────────────────────┬──────────────┬───────────────────────────┐ │   │
│  │  │ Column             │ Type         │ Description               │ │   │
│  │  ├────────────────────┼──────────────┼───────────────────────────┤ │   │
│  │  │ id                 │ UUID         │ Primary key               │ │   │
│  │  │ userId             │ UUID         │ FK → User                 │ │   │
│  │  │ tier               │ ENUM         │ FREE / PREMIUM            │ │   │
│  │  │ expiresAt          │ TIMESTAMP    │ Ngày hết hạn Premium      │ │   │
│  │  │ createdAt          │ TIMESTAMP    │ Ngày bắt đầu              │ │   │
│  │  └────────────────────┴──────────────┴───────────────────────────┘ │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MATCHING ALGORITHM                                   │
│                    Thuật toán ghép đôi 2 chiều                              │
└─────────────────────────────────────────────────────────────────────────────┘

Ý TƯỞNG:
- Match xảy ra khi CẢ HAI người cùng like nhau
- Một chiều like không tạo match

┌─────────────────────────────────────────────────────────────────────────────┐
│  PSEUDOCODE                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  function processSwipe(fromUserId, toUserId, action):                      │
│                                                                             │
│      // 1. Lưu swipe record                                                │
│      createSwipe({                                                         │
│          fromUserId,                                                       │
│          toUserId,                                                         │
│          action,  // LIKE, UNLIKE, SUPER_LIKE                              │
│          createdAt: now()                                                  │
│      })                                                                    │
│                                                                             │
│      // 2. Nếu là UNLIKE, không cần check match                           │
│      if (action === 'UNLIKE'):                                             │
│          return { matched: false }                                         │
│                                                                             │
│      // 3. Check xem đối phương đã like mình chưa                         │
│      reverseSwipe = findSwipe({                                            │
│          fromUserId: toUserId,                                             │
│          toUserId: fromUserId,                                             │
│          action: ['LIKE', 'SUPER_LIKE']                                    │
│      })                                                                    │
│                                                                             │
│      // 4. Nếu có reverse swipe → MATCH!                                  │
│      if (reverseSwipe exists):                                             │
│          match = createMatch({                                             │
│              user1Id: fromUserId,                                          │
│              user2Id: toUserId,                                            │
│              createdAt: now()                                              │
│          })                                                                │
│                                                                             │
│          // Tạo conversation để chat                                       │
│          createConversation({                                              │
│              matchId: match.id                                             │
│          })                                                                │
│                                                                             │
│          // Gửi push notification                                          │
│          sendPushNotification(fromUserId, "Bạn có match mới!")            │
│          sendPushNotification(toUserId, "Bạn có match mới!")              │
│                                                                             │
│          // Emit socket event                                              │
│          socket.emit('newMatch', { matchId, users: [from, to] })          │
│                                                                             │
│          return { matched: true, matchId: match.id }                      │
│                                                                             │
│      // 5. Chưa có reverse swipe → đợi                                    │
│      return { matched: false }                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

FLOW DIAGRAM:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  User A likes User B                                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────┐                                                   │
│  │ Check: B liked A?   │                                                   │
│  └─────────────────────┘                                                   │
│       │           │                                                        │
│      YES          NO                                                       │
│       │           │                                                        │
│       ▼           ▼                                                        │
│  ┌─────────┐  ┌─────────────────────┐                                      │
│  │ MATCH!  │  │ Lưu swipe, đợi B    │                                      │
│  │         │  │ like lại            │                                      │
│  └────┬────┘  └─────────────────────┘                                      │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────┐                                       │
│  │ - Create Match record           │                                       │
│  │ - Create Conversation           │                                       │
│  │ - Send push notifications       │                                       │
│  │ - Emit socket events            │                                       │
│  └─────────────────────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.5 Discovery Feed Algorithm (Tổng hợp)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISCOVERY FEED ALGORITHM                                  │
│                Thuật toán tổng hợp lấy feed profiles                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PIPELINE                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐        │
│  │ 1. FILTER  │──►│ 2. FETCH   │──►│ 3. SCORE   │──►│ 4. SORT    │        │
│  │ (DB level) │   │ (Pool)     │   │ (App level)│   │ (DESC)     │        │
│  └────────────┘   └────────────┘   └────────────┘   └────────────┘        │
│       │                │                │                │                 │
│       ▼                ▼                ▼                ▼                 │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐        │
│  │ 5. PAGINATE│──►│ 6. DISTANCE│──►│ 7. RESPONSE│                        │
│  │ (skip,take)│   │ (Haversine)│   │ (JSON)     │                        │
│  └────────────┘   └────────────┘   └────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

CHI TIẾT TỪNG BƯỚC:

STEP 1: DATABASE-LEVEL FILTERING
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHERE:                                                                     │
│  - isActive = true                  (profile đang hoạt động)               │
│  - photos.length >= 1               (có ít nhất 1 ảnh)                     │
│  - userId NOT IN excludedIds        (chưa swipe, chưa block)              │
│  - gender IN preferredGenders       (giới tính phù hợp)                   │
│  - age BETWEEN ageMin AND ageMax    (tuổi trong khoảng)                   │
│  - (optional) distance <= maxDistance (nếu có location)                   │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 2: FETCH CANDIDATE POOL
┌─────────────────────────────────────────────────────────────────────────────┐
│  poolSize = max(requestedLimit × 5, 50)                                    │
│                                                                             │
│  Tại sao fetch nhiều hơn?                                                  │
│  - Để có đủ data cho scoring                                               │
│  - Sau khi sort, lấy top N                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 3: CALCULATE SCORES
┌─────────────────────────────────────────────────────────────────────────────┐
│  for each candidate:                                                        │
│      score = scoreAge() + scoreGender() + scoreMajor()                     │
│            + scoreYear() + scoreCompleteness() + scoreActivity()           │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 4: SORT BY SCORE
┌─────────────────────────────────────────────────────────────────────────────┐
│  candidates.sort((a, b) => b.score - a.score)                              │
│                                                                             │
│  Kết quả: profiles có score cao nhất ở đầu                                 │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 5: PAGINATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  skip = (page - 1) × limit                                                 │
│  result = candidates.slice(skip, skip + limit)                             │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 6: CALCULATE DISTANCES
┌─────────────────────────────────────────────────────────────────────────────┐
│  for each profile in result:                                               │
│      profile.distance = haversine(myLat, myLng, profile.lat, profile.lng) │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 7: BUILD RESPONSE
┌─────────────────────────────────────────────────────────────────────────────┐
│  return {                                                                   │
│      data: profiles,                                                       │
│      pagination: { page, limit, total, totalPages, hasMore }               │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. File Call Chain

### 6.1 Swipe Action Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWIPE ACTION CHAIN                                   │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:

DatingDiscoveryScreen.tsx
    │
    │ handleSwipe(profile, direction)
    ▼
hooks/useDiscoveryFeed.ts
    │
    │ swipe({ targetUserId, action })
    ▼
services/dating/datingService.ts
    │
    │ datingService.swipe()
    │ POST /api/v1/dating/swipe
    ▼
─────────────────────────────────────────────────────────────────────────────

BACKEND:

dating.routes.ts
    │
    │ router.post('/swipe', ...)
    ▼
swipe/swipe.route.ts
    │
    │ POST '/'
    ▼
swipe/swipe.controller.ts
    │
    │ swipeController.create()
    │ - Validate request body
    │ - Call service
    ▼
swipe/swipe.service.ts
    │
    │ swipeService.createSwipe()
    │ - Check daily limit
    │ - Create swipe record
    │ - Check mutual like
    ▼
match/match.service.ts (nếu mutual like)
    │
    │ matchService.createMatch()
    │ - Create match record
    │ - Create conversation
    │ - Send notifications
    ▼
─────────────────────────────────────────────────────────────────────────────

RESPONSE → Frontend → Update UI
```

---

### 6.2 Discovery Feed Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DISCOVERY FEED CHAIN                                   │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:

DatingDiscoveryScreen.tsx
    │
    │ useDiscoveryFeed()
    ▼
hooks/useDiscoveryFeed.ts
    │
    │ useQuery(['dating', 'feed'], ...)
    ▼
services/dating/datingService.ts
    │
    │ datingService.getDiscoveryFeed()
    │ GET /api/v1/dating/discovery
    ▼
─────────────────────────────────────────────────────────────────────────────

BACKEND:

dating.routes.ts
    │
    │ router.use('/discovery', ...)
    ▼
discovery/discovery.route.ts
    │
    │ GET '/'
    ▼
discovery/discovery.controller.ts
    │
    │ discoveryController.getFeed()
    ▼
discovery/discovery.service.ts
    │
    │ discoveryService.getDiscoveryFeed()
    │ - Get user preferences
    │ - Build exclusion list
    │ - Query candidates
    ▼
discovery/scoring.service.ts
    │
    │ scoringService.calculateScores()
    │ - Score each candidate
    │ - Sort by score
    ▼
location/location.service.ts
    │
    │ locationService.calculateDistance()
    │ - Haversine formula
    ▼
─────────────────────────────────────────────────────────────────────────────

RESPONSE → Frontend → Render CardStack
```

---

### 6.3 Chat Message Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAT MESSAGE CHAIN                                    │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:

DatingChatRoomScreen.tsx
    │
    │ handleSend(content)
    │ useMutation(sendMutation)
    ▼
services/dating/datingChatService.ts
    │
    │ datingChatService.sendMessage()
    │ POST /api/v1/dating/chat/messages
    ▼
─────────────────────────────────────────────────────────────────────────────

BACKEND:

dating.routes.ts
    │
    │ router.use('/chat', ...)
    ▼
chat/dating-chat.route.ts
    │
    │ POST '/messages'
    ▼
chat/dating-chat.controller.ts
    │
    │ chatController.sendMessage()
    ▼
chat/dating-chat.service.ts
    │
    │ chatService.sendMessage()
    │ - Save message to DB
    │ - Emit socket event
    ▼
socket/socketService.ts
    │
    │ io.to(`user:${recipientId}`).emit('newMessage', ...)
    ▼
─────────────────────────────────────────────────────────────────────────────

SOCKET EVENT → Recipient's Frontend → Update chat UI
```

---

### 6.4 Payment Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT CHAIN                                       │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:

DatingPremiumScreen.tsx
    │
    │ handlePurchase(plan, method)
    ▼
services/dating/datingPaymentService.ts
    │
    │ datingPaymentService.createVNPayPayment()
    │ OR datingPaymentService.createVietQRPayment()
    ▼
─────────────────────────────────────────────────────────────────────────────

BACKEND (VNPay):

payment/payment.route.ts
    │
    │ POST '/vnpay/create'
    ▼
payment/payment.controller.ts
    │
    │ paymentController.createVNPayPayment()
    ▼
payment/vnpay.service.ts
    │
    │ vnpayService.createPaymentUrl()
    │ - Generate secure hash
    │ - Build redirect URL
    ▼
─────────────────────────────────────────────────────────────────────────────

[User pays on VNPay portal]
    │
    ▼
payment/payment.route.ts
    │
    │ GET '/vnpay/return'
    ▼
payment/payment.controller.ts
    │
    │ paymentController.vnpayReturn()
    ▼
payment/vnpay.service.ts
    │
    │ vnpayService.verifyReturnUrl()
    ▼
payment/subscription.service.ts
    │
    │ subscriptionService.upgradeToPremiun()
    │ - Update user subscription
    │ - Set expiry date
    ▼
─────────────────────────────────────────────────────────────────────────────

REDIRECT → DatingPaymentResultScreen (Success/Failure)
```

---

### 6.5 Profile Update Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROFILE UPDATE CHAIN                                   │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:

DatingProfileSetupScreen.tsx
    │
    │ handleSave(profileData)
    ▼
services/dating/datingService.ts
    │
    │ datingService.updateProfile()
    │ PUT /api/v1/dating/profile
    ▼
─────────────────────────────────────────────────────────────────────────────

BACKEND:

profile/profile.route.ts
    │
    │ PUT '/'
    ▼
profile/profile.controller.ts
    │
    │ profileController.updateProfile()
    │ - Validate with Zod schema
    ▼
profile/profile.service.ts
    │
    │ profileService.updateProfile()
    │ - Update DatingProfile
    │ - Update DatingPhotos
    │ - Update DatingInterests
    │ - Update DatingPrompts
    ▼
─────────────────────────────────────────────────────────────────────────────

RESPONSE → Frontend → Navigate or show success
```

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       1:1        ┌──────────────────┐
│      User        │◄────────────────►│  DatingProfile   │
│  (from main)     │                  │                  │
└──────────────────┘                  └──────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼ 1:N                     ▼ 1:1                     ▼ 1:N
          ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
          │   DatingPhoto    │      │DatingPreferences │      │  DatingInterest  │
          └──────────────────┘      └──────────────────┘      └──────────────────┘

                                              │ 1:N
                                              ▼
                                    ┌──────────────────┐
                                    │   DatingPrompt   │
                                    └──────────────────┘

┌──────────────────┐                ┌──────────────────┐
│  DatingProfile   │───────────────►│   DatingSwipe    │
│     (swiper)     │     1:N        │                  │
└──────────────────┘                └──────────────────┘
                                            │
                                            │ Creates
                                            ▼
┌──────────────────┐       N:N      ┌──────────────────┐
│  DatingProfile   │◄──────────────►│   DatingMatch    │
│                  │                │                  │
└──────────────────┘                └──────────────────┘
                                            │
                                            │ 1:1
                                            ▼
                                    ┌──────────────────┐
                                    │DatingConversation│
                                    └──────────────────┘
                                            │
                                            │ 1:N
                                            ▼
                                    ┌──────────────────┐
                                    │  DatingMessage   │
                                    └──────────────────┘

┌──────────────────┐                ┌──────────────────┐
│  DatingProfile   │───────────────►│   DatingBlock    │
│    (blocker)     │     1:N        │                  │
└──────────────────┘                └──────────────────┘

┌──────────────────┐       1:1      ┌──────────────────┐
│  DatingProfile   │◄──────────────►│   DatingUsage    │
│                  │                │ (daily limits)   │
└──────────────────┘                └──────────────────┘

┌──────────────────┐       1:1      ┌──────────────────┐
│      User        │◄──────────────►│DatingSubscription│
│                  │                │                  │
└──────────────────┘                └──────────────────┘
                                            │
                                            │ 1:N
                                            ▼
                                    ┌──────────────────┐
                                    │DatingTransaction │
                                    └──────────────────┘
```

### 7.2 Table Summary

| Table | Mô tả | Quan hệ |
|-------|-------|---------|
| DatingProfile | Hồ sơ dating của user | 1:1 với User |
| DatingPhoto | Ảnh trong profile | N:1 với DatingProfile |
| DatingInterest | Sở thích | N:1 với DatingProfile |
| DatingPrompt | Câu hỏi gợi mở | N:1 với DatingProfile |
| DatingPreferences | Preferences tìm kiếm | 1:1 với DatingProfile |
| DatingSwipe | Lịch sử swipe | N:1 với DatingProfile |
| DatingMatch | Cặp đã match | N:N giữa 2 DatingProfile |
| DatingConversation | Cuộc hội thoại | 1:1 với DatingMatch |
| DatingMessage | Tin nhắn | N:1 với DatingConversation |
| DatingBlock | Danh sách block | N:1 với DatingProfile |
| DatingUsage | Tracking daily usage | 1:1 với DatingProfile |
| DatingSubscription | Thông tin Premium | 1:1 với User |
| DatingTransaction | Lịch sử giao dịch | N:1 với DatingSubscription |

---

## 8. API Endpoints

### 8.1 Profile APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/profile` | Lấy profile của mình |
| POST | `/api/v1/dating/profile` | Tạo profile mới |
| PUT | `/api/v1/dating/profile` | Cập nhật profile |
| DELETE | `/api/v1/dating/profile` | Xóa profile |
| GET | `/api/v1/dating/profile/:userId` | Lấy profile theo userId |

### 8.2 Discovery APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/discovery` | Lấy feed profiles |
| GET | `/api/v1/dating/discovery/likes` | Lấy danh sách người like mình |

### 8.3 Swipe APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/dating/swipe` | Thực hiện swipe (like/unlike/superlike) |
| POST | `/api/v1/dating/swipe/rewind` | Quay lại swipe trước |

### 8.4 Match APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/matches` | Lấy danh sách matches |
| DELETE | `/api/v1/dating/matches/:matchId` | Unmatch |

### 8.5 Chat APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/chat/conversations` | Lấy danh sách conversations |
| GET | `/api/v1/dating/chat/conversations/:id` | Lấy hoặc tạo conversation |
| GET | `/api/v1/dating/chat/messages/:conversationId` | Lấy messages |
| POST | `/api/v1/dating/chat/messages` | Gửi message |

### 8.6 Location APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/dating/location` | Cập nhật vị trí |

### 8.7 Block APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/blocked-users` | Lấy danh sách đã block |
| POST | `/api/v1/dating/block` | Block user |
| DELETE | `/api/v1/dating/block/:userId` | Unblock user |

### 8.8 Payment APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/dating/payment/subscription` | Lấy thông tin subscription |
| POST | `/api/v1/dating/payment/vnpay/create` | Tạo thanh toán VNPay |
| GET | `/api/v1/dating/payment/vnpay/return` | VNPay callback |
| POST | `/api/v1/dating/payment/vietqr/create` | Tạo QR thanh toán |
| POST | `/api/v1/dating/payment/vietqr/verify` | Verify thủ công |
| POST | `/api/v1/dating/payment/sepay/webhook` | SePay webhook |

---

## Summary

Module Dating bao gồm:

**Frontend:**
- 15+ screens với navigation
- Swipe cards với gesture animations
- Real-time chat qua Socket.io
- Premium subscription flow

**Backend:**
- 7 sub-modules (profile, discovery, swipe, match, location, chat, payment)
- Scoring algorithm với 6 factors
- VNPay + VietQR payment
- Push notifications via FCM

**Database:**
- 13 dating-specific tables
- Optimized indexes

**Flows chính:**
1. Onboarding (4 steps)
2. Swipe & Match
3. Chat real-time
4. Premium upgrade
5. Block/Unmatch
6. Location-based discovery

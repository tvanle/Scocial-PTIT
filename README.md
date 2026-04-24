# PTIT Social - Mang xa hoi sinh vien PTIT

Ung dung mang xa hoi danh rieng cho sinh vien Hoc vien Cong nghe Buu chinh Vien thong (PTIT).

## Tinh nang chinh

### Mang xa hoi
- **Dang nhap/Dang ky**: Xac thuc voi email sinh vien PTIT, OTP verification
- **News Feed**: Xem va tuong tac voi bai dang (like, comment, share)
- **Profile**: Trang ca nhan voi thong tin sinh vien
- **Chat/Messenger**: Nhan tin realtime voi Socket.io
- **Thong bao**: Push notifications voi Firebase Cloud Messaging
- **Tim kiem**: Tim ban be, bai viet

### Dating Module
- **Discovery**: Kham pha ho so voi swipe cards animation (Tinder-style)
- **Matching**: He thong match khi ca 2 cung like
- **Dating Chat**: Nhan tin realtime voi nguoi da match
- **Premium**: Goi nang cap voi Super Like, Rewind, xem ai like minh
- **Location-based**: Hien thi khoang cach dua tren GPS
- **Preferences**: Bo loc theo gioi tinh, tuoi, nganh hoc, khoang cach
- **Payment**: Tich hop VNPay, VietQR, SePay

## Kien truc

### Mobile App (React Native + Expo)

```
src/
├── components/          # UI Components
│   ├── common/          # Shared components (Button, Input, Avatar...)
│   ├── home/            # Home screen components
│   ├── profile/         # Profile components
│   └── chat/            # Chat components
├── screens/             # App screens
│   ├── auth/            # Login, Register, ForgotPassword, 2FA
│   ├── home/            # Home feed
│   ├── profile/         # User profile
│   ├── chat/            # Chat/Messenger
│   ├── notification/    # Notifications
│   ├── search/          # Search
│   └── dating/          # Dating module (discovery, chat, premium, etc.)
├── navigation/          # React Navigation setup
├── services/            # API services
├── store/               # State management (Zustand)
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── constants/           # Theme, strings, API config
└── types/               # TypeScript types
```

### Backend (Monolithic API)

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/            # Authentication, JWT, 2FA
│   │   ├── user/            # User management, profiles
│   │   ├── post/            # Posts, comments, likes
│   │   ├── chat/            # Real-time messaging
│   │   ├── notification/    # Push notifications
│   │   ├── media/           # File uploads (MinIO/S3)
│   │   └── dating/          # Dating module
│   │       ├── profile/     # Dating profiles
│   │       ├── discovery/   # Discovery feed + scoring algorithm
│   │       ├── swipe/       # Swipe actions
│   │       ├── match/       # Match management
│   │       ├── chat/        # Dating chat
│   │       ├── location/    # Geo-location services
│   │       └── payment/     # VNPay, VietQR, SePay integration
│   ├── middleware/          # Auth, rate limiting, validation
│   └── utils/               # Helpers, constants
├── prisma/                  # Prisma schema & migrations
└── docker/                  # Docker compose
```

## Bat dau

### Yeu cau

- Node.js >= 18
- Expo CLI
- Docker & Docker Compose (cho backend)
- PostgreSQL
- Redis

### Cai dat Mobile App

```bash
# Cai dat dependencies
npm install

# Chay app
npm start

# Chay tren iOS
npm run ios

# Chay tren Android
npm run android
```

### Cai dat Backend

```bash
# Di chuyen den thu muc backend
cd backend

# Cai dat dependencies
npm install

# Chay migrations
npm run migrate

# Chay development server
npm run dev
```

### Docker

```bash
# Di chuyen den thu muc docker
cd backend/docker

# Chay tat ca services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

## Tech Stack

### Mobile
| Cong nghe | Muc dich |
|-----------|----------|
| React Native + Expo 54 | Framework |
| TypeScript | Language |
| React Navigation v7 | Navigation |
| Zustand | State management |
| React Query | Data fetching & caching |
| React Native Reanimated 3 | Animations (60fps) |
| Gesture Handler | Touch gestures |
| Socket.io Client | Real-time communication |

### Backend
| Cong nghe | Muc dich |
|-----------|----------|
| Node.js + Express | Server framework |
| TypeScript | Language |
| Prisma ORM | Database ORM |
| PostgreSQL | Main database |
| Redis | Caching & sessions |
| Socket.io | Real-time messaging |
| MinIO | S3-compatible storage |
| Firebase | Push notifications |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Dang ky
- `POST /api/v1/auth/login` - Dang nhap
- `POST /api/v1/auth/verify-email` - Xac thuc OTP
- `POST /api/v1/auth/forgot-password` - Quen mat khau
- `POST /api/v1/auth/2fa/setup` - Cai dat 2FA

### Users
- `GET /api/v1/users/profile` - Lay profile
- `PUT /api/v1/users/profile` - Cap nhat profile
- `POST /api/v1/users/:id/follow` - Follow user

### Posts
- `GET /api/v1/posts/feed` - News feed
- `POST /api/v1/posts` - Tao bai viet
- `POST /api/v1/posts/:id/like` - Like bai viet
- `POST /api/v1/posts/:id/comments` - Binh luan

### Chat
- `GET /api/v1/chat/conversations` - Danh sach hoi thoai
- `POST /api/v1/chat/conversations/:id/messages` - Gui tin nhan

### Dating
- `GET /api/v1/dating/discovery` - Lay danh sach profiles
- `POST /api/v1/dating/swipe` - Swipe action (like/nope)
- `GET /api/v1/dating/matches` - Danh sach matches
- `POST /api/v1/dating/payment/create` - Tao thanh toan Premium

## Theme mau PTIT

```javascript
Primary: '#C41E3A'      // Do PTIT
PrimaryDark: '#9B1B30'
PrimaryLight: '#E63950'
Secondary: '#2C3E50'
```

## Tai lieu

- [Dating Module Analysis](./DATING_MODULE_ANALYSIS.md) - Phan tich ky thuat chi tiet
- [Dating Module Report](./docs/DATING_MODULE_REPORT.md) - Bao cao cho nguoi khong chuyen

## Dong gop

Moi dong gop deu duoc chao don! Vui long tao Pull Request hoac Issue.

## License

MIT License

---

Made with by PTIT Students

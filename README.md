# PTIT Social - Mạng xã hội sinh viên PTIT

Ứng dụng mạng xã hội dành riêng cho sinh viên Học viện Công nghệ Bưu chính Viễn thông (PTIT).

## 🎨 Tính năng chính

- **Đăng nhập/Đăng ký**: Xác thực với email sinh viên PTIT
- **News Feed**: Xem và tương tác với bài đăng
- **Profile**: Trang cá nhân với thông tin sinh viên
- **Chat/Messenger**: Nhắn tin realtime
- **Thông báo**: Push notifications
- **Tìm kiếm**: Tìm bạn bè, nhóm, bài viết
- **Nhóm**: Tạo và quản lý các nhóm sinh viên
- **Stories**: Đăng stories (coming soon)

## 🏗️ Kiến trúc

### Mobile App (React Native + Expo)

```
src/
├── components/          # UI Components
│   ├── common/          # Shared components (Button, Input, Avatar...)
│   ├── home/            # Home screen components
│   ├── profile/         # Profile components
│   └── chat/            # Chat components
├── screens/             # App screens
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── home/            # Home feed
│   ├── profile/         # User profile
│   ├── chat/            # Chat/Messenger
│   ├── notification/    # Notifications
│   └── search/          # Search & Groups
├── navigation/          # React Navigation setup
├── services/            # API services
├── store/               # State management (Zustand)
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── constants/           # Theme, strings, API config
└── types/               # TypeScript types
```

### Backend (Microservices)

```
backend/
├── gateway/             # API Gateway (Express)
├── services/
│   ├── auth-service/    # Authentication
│   ├── user-service/    # User management
│   ├── post-service/    # Posts & Comments
│   ├── chat-service/    # Real-time chat
│   ├── notification-service/
│   ├── media-service/   # File uploads
│   └── group-service/   # Group management
├── shared/              # Shared types & utils
└── docker/              # Docker compose
```

## 🚀 Bắt đầu

### Yêu cầu

- Node.js >= 18
- Expo CLI
- Docker & Docker Compose (cho backend)

### Cài đặt Mobile App

```bash
# Cài đặt dependencies
npm install

# Chạy app
npm start

# Chạy trên iOS
npm run ios

# Chạy trên Android
npm run android
```

### Cài đặt Backend

```bash
# Di chuyển đến thư mục backend
cd backend/docker

# Tạo file .env
cp .env.example .env

# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

## 🎨 Theme màu PTIT

```javascript
Primary: '#C41E3A'      // Đỏ PTIT
PrimaryDark: '#9B1B30'
PrimaryLight: '#E63950'
Secondary: '#2C3E50'
```

## 📱 Screenshots

| Login | Home | Profile | Chat |
|-------|------|---------|------|
| ![Login](screenshots/login.png) | ![Home](screenshots/home.png) | ![Profile](screenshots/profile.png) | ![Chat](screenshots/chat.png) |

## 🔧 Tech Stack

### Mobile
- React Native + Expo
- TypeScript
- React Navigation
- Zustand (State management)
- React Query
- Axios

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- MongoDB
- Redis
- Elasticsearch
- Docker

## 📝 API Endpoints

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`

### Users
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `GET /api/v1/users/:id`
- `POST /api/v1/users/:id/friend-request`

### Posts
- `GET /api/v1/posts/feed`
- `POST /api/v1/posts`
- `POST /api/v1/posts/:id/like`
- `POST /api/v1/posts/:id/comments`

### Chat
- `GET /api/v1/chat/conversations`
- `POST /api/v1/chat/conversations/:id/messages`

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo Pull Request hoặc Issue.

## 📄 License

MIT License - Xem [LICENSE](LICENSE) để biết thêm chi tiết.

---

Made with ❤️ by PTIT Students

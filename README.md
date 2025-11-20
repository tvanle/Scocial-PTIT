# PTIT Social Network

Ứng dụng mạng xã hội PTIT được xây dựng với kiến trúc Microservices, Android (Kotlin), và Docker.

## Kiến trúc hệ thống

### Backend - Microservices (Spring Boot + Spring Cloud)

```
backend/
├── services/
│   ├── service-discovery/     # Eureka Server (Port 8761)
│   ├── api-gateway/           # Spring Cloud Gateway + JWT Auth (Port 8080)
│   ├── auth-service/          # Authentication & User Management (Port 8081)
│   ├── post-service/          # Posts, Likes, Shares (Port 8082)
│   ├── comment-service/       # Comments (Port 8083)
│   └── chat-service/          # Real-time Chat với WebSocket (Port 8084)
```

### Databases
- **PostgreSQL**: Auth, Post, Comment services
- **MongoDB**: Chat service (messages)

### Frontend - Android App (Kotlin)
- MVVM Architecture
- Retrofit + OkHttp
- Coroutines
- Glide cho image loading
- Material Design 3
- WebSocket cho chat realtime

## Tính năng chính

### Đã triển khai:
- ✅ Đăng ký & Đăng nhập với JWT
- ✅ News Feed (Bảng tin)
- ✅ Đăng bài viết (text, image, video)
- ✅ Like/Unlike bài viết
- ✅ Comment bài viết
- ✅ Chat/Messaging realtime (WebSocket)
- ✅ API Gateway với JWT authentication
- ✅ Service Discovery (Eureka)
- ✅ Docker & Docker Compose

### Giao diện Android:
- Màn hình đăng nhập/đăng ký
- News Feed giống Facebook
- Bottom Navigation (Home, Profile, Chat, Notifications)
- RecyclerView cho danh sách bài viết
- SwipeRefreshLayout

## Cài đặt và chạy

### Yêu cầu:
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- Android Studio (cho Android app)
- Android SDK 24+

### Build Backend Services:

```bash
# Build từng service
cd backend/services/service-discovery
mvn clean package

cd ../auth-service
mvn clean package

cd ../post-service
mvn clean package

cd ../comment-service
mvn clean package

cd ../chat-service
mvn clean package

cd ../api-gateway
mvn clean package
```

### Chạy với Docker Compose:

```bash
# Từ thư mục root
docker-compose up -d
```

Services sẽ chạy ở các port:
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761
- Auth Service: http://localhost:8081
- Post Service: http://localhost:8082
- Comment Service: http://localhost:8083
- Chat Service: http://localhost:8084

### Chạy Android App:

1. Mở Android Studio
2. Import project từ thư mục `android-app/`
3. Sync Gradle
4. Chạy app trên emulator hoặc thiết bị thật

**Lưu ý**: Nếu chạy trên emulator, API sẽ tự động trỏ đến `http://10.0.2.2:8080`. Nếu chạy trên thiết bị thật, cần đổi IP trong `build.gradle.kts`.

## API Endpoints

### Authentication (Public)
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/validate?token=xxx
```

### Posts (Protected)
```
GET    /api/posts/feed
POST   /api/posts
GET    /api/posts/{postId}
POST   /api/posts/{postId}/like
DELETE /api/posts/{postId}/like
DELETE /api/posts/{postId}
```

### Comments (Protected)
```
GET  /api/comments/post/{postId}
POST /api/comments
```

### Chat (Protected)
```
WebSocket: ws://localhost:8080/ws
```

## Database Schema

### Auth Service (PostgreSQL)
```sql
users: id, email, username, password, full_name, student_id, is_active, created_at, updated_at
```

### Post Service (PostgreSQL)
```sql
posts: id, user_id, content, image_url, video_url, like_count, comment_count, share_count, privacy, created_at, updated_at
post_likes: id, post_id, user_id, created_at
```

### Comment Service (PostgreSQL)
```sql
comments: id, post_id, user_id, content, parent_id, created_at
```

### Chat Service (MongoDB)
```json
messages: {
  _id, senderId, receiverId, content, imageUrl, isRead, createdAt
}
```

## Công nghệ sử dụng

### Backend:
- Spring Boot 3.2.0
- Spring Cloud 2023.0.0
- Spring Security + JWT
- Spring Data JPA
- Spring Cloud Gateway
- Eureka Server/Client
- PostgreSQL 15
- MongoDB 7
- WebSocket (STOMP)

### Android:
- Kotlin
- Android SDK 24+
- Material Design 3
- Retrofit 2
- OkHttp 4
- Glide
- Coroutines
- Room Database
- Navigation Component

### DevOps:
- Docker
- Docker Compose

## Roadmap & Cải tiến

- [ ] Upload ảnh/video lên cloud (AWS S3, Cloudinary)
- [ ] Notification Service
- [ ] Friend/Follow system
- [ ] Story feature (giống Instagram/Facebook)
- [ ] Video call
- [ ] Search functionality
- [ ] Admin dashboard
- [ ] Redis cache
- [ ] Elasticsearch cho search
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment

## Tác giả

PTIT Social Network - Dự án mạng xã hội cho sinh viên PTIT

## License

MIT License

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PTIT Social is a full-stack mobile social networking application for PTIT (Học viện Công nghệ Bưu chính Viễn thông) students. It's a monorepo with a React Native/Expo mobile app and backend microservices.

## Commands

### Mobile App (root directory)
```bash
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios            # Run on iOS
```

### Backend Services (in each service directory)
```bash
npm run dev            # Development with hot reload
npm run build          # Compile TypeScript
npm run start          # Run compiled server
npm run migrate        # Run Prisma migrations (PostgreSQL services)
npm run generate       # Generate Prisma client
```

### Docker (backend/docker)
```bash
docker-compose up -d   # Start all services
docker-compose down    # Stop all services
```

## Architecture

### Monorepo Structure
- `/src/` - React Native mobile app
- `/backend/` - Monolithic backend API server (port 3001)

### Backend Modules
All modules are integrated into a single Express application:

| Module | Route | Purpose |
|--------|-------|---------|
| Auth | `/api/v1/auth` | Authentication, JWT tokens, register/login |
| Users | `/api/v1/users` | User profiles, follow system |
| Posts | `/api/v1/posts` | Posts, comments, likes, feed |
| Chat | `/api/v1/chat` | Real-time messaging, conversations |
| Notifications | `/api/v1/notifications` | User notifications |
| Media | `/api/v1/media` | File uploads (images, videos) |

### API Routes
- **Public routes**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/users/search`
- **Protected routes** (JWT required): All other endpoints require Bearer token authentication

### Mobile App Architecture
- **State**: Zustand (primary), Redux Toolkit (legacy)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Navigation**: React Navigation v7 (native-stack, bottom-tabs)
- **Token Storage**: Expo Secure Store

### Key Tech Stack
- **Mobile**: TypeScript, Expo 54, React Native
- **Backend**: TypeScript, Express, Prisma ORM
- **Database**: PostgreSQL (single database for all modules)
- **Cache**: Redis
- **Infrastructure**: Docker Compose, Socket.io (real-time), Firebase (push notifications)
- **Storage**: Local filesystem or AWS S3 (configurable)

## Database Schema

**Single PostgreSQL database** with Prisma ORM. Schema file at: `backend/prisma/schema.prisma`

### Main Models:
- **User** - User accounts, profiles, authentication
- **RefreshToken** - JWT refresh tokens
- **Follow** - User follow relationships
- **Post** - User posts with privacy settings
- **Comment** - Post comments (supports nested replies)
- **Like** - Post likes
- **Media** - Uploaded files (images, videos)
- **Conversation** - Chat conversations (private/group)
- **ConversationParticipant** - Conversation members
- **Message** - Chat messages with read status
- **MessageReadStatus** - Message read tracking
- **Notification** - User notifications

### Database Connection:
```
postgresql://postgres:postgres@localhost:5434/ptit_social
```

## Development Notes

- TypeScript strict mode is enabled across the entire project
- JWT authentication via Bearer tokens (validated by middleware)
- Rate limiting: 1000 requests/15 minutes per IP
- File storage supports both local (`uploads/`) and AWS S3 (controlled by `USE_S3` env var)
- Real-time chat via Socket.io on the same port as HTTP server
- All database operations use Prisma ORM with PostgreSQL
- Redis for caching and session management
- Theme color: PTIT Red `#C41E3A`

## Real-time Features (Socket.io)

Socket.io runs on the same server (port 3001) for real-time chat:

**Events:**
- `join` - User joins their room
- `sendMessage` - Send a message to conversation participants
- `newMessage` - Receive new messages
- `typing` - Typing indicators
- `userTyping` - Receive typing status

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
- `/backend/gateway/` - API Gateway (port 3000)
- `/backend/services/` - Microservices

### Microservices (each in `backend/services/`)
| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| auth-service | 3001 | PostgreSQL | Authentication, JWT tokens |
| user-service | 3002 | PostgreSQL | User profiles |
| post-service | 3003 | PostgreSQL | Posts, comments, likes |
| chat-service | 3004 | MongoDB | Real-time messaging |
| notification-service | 3005 | MongoDB | Push notifications |
| media-service | 3006 | S3/Local | File uploads |
| group-service | 3007 | PostgreSQL | Group management |

### API Gateway Routing
All requests go through gateway at `/api/v1/{service}`:
- Public: `/api/v1/auth/*`
- Protected (JWT required): `/api/v1/users/*`, `/api/v1/posts/*`, `/api/v1/chat/*`, `/api/v1/notifications/*`, `/api/v1/media/*`, `/api/v1/groups/*`

### Mobile App Architecture
- **State**: Zustand (primary), Redux Toolkit (legacy)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Navigation**: React Navigation v7 (native-stack, bottom-tabs)
- **Token Storage**: Expo Secure Store

### Key Tech Stack
- **Mobile**: TypeScript, Expo 54, React Native
- **Backend**: TypeScript, Express, Prisma (PostgreSQL), Mongoose (MongoDB)
- **Infrastructure**: Docker Compose, Redis caching, Firebase (push notifications)

## Database Schema

PostgreSQL services use Prisma. Schema files at:
- `backend/services/auth-service/prisma/schema.prisma`
- `backend/services/user-service/prisma/schema.prisma`
- `backend/services/post-service/prisma/schema.prisma`
- `backend/services/group-service/prisma/schema.prisma`

MongoDB services (chat, notification) use Mongoose with models in their respective `src/models/` directories.

## Development Notes

- TypeScript strict mode is enabled across the entire project
- JWT tokens are validated at the gateway level before proxying to services
- Rate limiting: 1000 requests/15 minutes per IP at gateway
- File storage supports both local (`uploads/`) and AWS S3 (controlled by `USE_S3` env var)
- Theme color: PTIT Red `#C41E3A`

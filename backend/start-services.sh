#!/bin/bash

# Start all backend services
BACKEND_DIR="/Users/tvanlee/Documents/Moblie-Coding/Project/Scocial-PTIT/backend/services"

echo "🚀 Starting PTIT Social Backend Services..."

# Auth Service
cd "$BACKEND_DIR/auth-service" && npm run dev &
sleep 2

# User Service
cd "$BACKEND_DIR/user-service" && npm run dev &
sleep 2

# Post Service
cd "$BACKEND_DIR/post-service" && npm run dev &
sleep 2

# Chat Service
cd "$BACKEND_DIR/chat-service" && npm run dev &
sleep 2

# Notification Service
cd "$BACKEND_DIR/notification-service" && npm run dev &
sleep 2

# Media Service
cd "$BACKEND_DIR/media-service" && npm run dev &
sleep 2

# Group Service
cd "$BACKEND_DIR/group-service" && npm run dev &

echo ""
echo "✅ All services starting..."
echo ""
echo "Services:"
echo "  - Auth:         http://localhost:3001"
echo "  - User:         http://localhost:3002"
echo "  - Post:         http://localhost:3003"
echo "  - Chat:         http://localhost:3004"
echo "  - Notification: http://localhost:3005"
echo "  - Media:        http://localhost:3006"
echo "  - Group:        http://localhost:3007"
echo ""
echo "Press Ctrl+C to stop all services"

wait

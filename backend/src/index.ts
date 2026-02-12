import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config';
import { prisma, disconnectDatabases } from './config/database';
import { errorHandler, notFoundHandler } from './middleware';

// Import routes
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/user';
import { postRoutes } from './modules/post';
import { mediaRoutes } from './modules/media';
import { groupRoutes } from './modules/group';
import { notificationRoutes } from './modules/notification';
import { chatRoutes } from './modules/chat';
import { datingRoutes } from './modules/dating';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, error: 'Too many requests, please try again later' },
  })
);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/dating', datingRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('sendMessage', (data) => {
    // Broadcast to conversation participants
    data.participants?.forEach((userId: string) => {
      io.to(userId).emit('newMessage', data);
    });
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('userTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Create uploads directory
    const fs = await import('fs/promises');
    await fs.mkdir(config.upload.dir, { recursive: true });

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📚 API: http://localhost:${config.port}/api/v1`);
      console.log(`🔌 Socket.io: http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down...');
  await disconnectDatabases();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export { app, io };

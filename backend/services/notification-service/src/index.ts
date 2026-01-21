import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { ERROR_MESSAGES } from './constants';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: config.socket.cors,
});

// Store io instance in app for access in routes
app.set('io', io);

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(config.mongodb.uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// API Routes
app.use('/api', routes);

// Socket.io authentication and handlers
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error(ERROR_MESSAGES.AUTHENTICATION_ERROR));
  }
  (socket as any).userId = userId;
  next();
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  console.log(`User connected to notifications: ${userId}`);

  // Join user's notification room
  socket.join(`user:${userId}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected from notifications: ${userId}`);
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
httpServer.listen(config.port, () => {
  console.log(`🔔 Notification Service running on port ${config.port}`);
});

export default app;

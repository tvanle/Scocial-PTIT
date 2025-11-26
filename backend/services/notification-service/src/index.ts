import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3005;

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ptit_notifications';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Socket.io authentication and handlers
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error('Authentication error'));
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

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
});

export default app;

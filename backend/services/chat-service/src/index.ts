import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import { setupSocketHandlers } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/ptit_chat';

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-service' });
});

// Routes
app.use('/api/chat', chatRoutes);

// Socket.io
setupSocketHandlers(io);

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('📦 Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`💬 Chat Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;

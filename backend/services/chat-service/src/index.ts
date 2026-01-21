import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware';
import { initializeSocket } from './socket';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chat-service' });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    console.log('📦 Connected to MongoDB');
    server.listen(config.port, () => {
      console.log(`💬 Chat Service running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;

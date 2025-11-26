import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  post: process.env.POST_SERVICE_URL || 'http://localhost:3003',
  chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3006',
  group: process.env.GROUP_SERVICE_URL || 'http://localhost:3007',
};

// Proxy options factory
const createProxyOptions = (target: string, pathRewrite?: Record<string, string>): Options => ({
  target,
  changeOrigin: true,
  pathRewrite,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    (res as express.Response).status(502).json({ error: 'Service unavailable' });
  },
});

// Auth routes (no authentication required)
app.use('/api/v1/auth', createProxyMiddleware(createProxyOptions(services.auth, {
  '^/api/v1/auth': '/api/auth',
})));

// Protected routes - require authentication
app.use('/api/v1/users', authMiddleware, createProxyMiddleware(createProxyOptions(services.user, {
  '^/api/v1/users': '/api/users',
})));

app.use('/api/v1/posts', authMiddleware, createProxyMiddleware(createProxyOptions(services.post, {
  '^/api/v1/posts': '/api/posts',
})));

app.use('/api/v1/chat', authMiddleware, createProxyMiddleware(createProxyOptions(services.chat, {
  '^/api/v1/chat': '/api/chat',
})));

app.use('/api/v1/notifications', authMiddleware, createProxyMiddleware(createProxyOptions(services.notification, {
  '^/api/v1/notifications': '/api/notifications',
})));

app.use('/api/v1/media', authMiddleware, createProxyMiddleware(createProxyOptions(services.media, {
  '^/api/v1/media': '/api/media',
})));

app.use('/api/v1/groups', authMiddleware, createProxyMiddleware(createProxyOptions(services.group, {
  '^/api/v1/groups': '/api/groups',
})));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

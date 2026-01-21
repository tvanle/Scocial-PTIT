import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorMiddleware } from './middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for local storage
app.use('/uploads', express.static(path.resolve(config.localUploadDir)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'media-service' });
});

// API Routes
app.use('/api', routes);

// Error handler
app.use(errorMiddleware);

// Start server
app.listen(config.port, () => {
  console.log(`📁 Media Service running on port ${config.port}`);
});

export default app;

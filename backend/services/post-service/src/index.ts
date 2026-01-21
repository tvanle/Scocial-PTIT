import express from 'express';
import cors from 'cors';
import { config } from './config';
import routes from './routes';
import { errorMiddleware } from './middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'post-service' });
});

// API Routes
app.use('/api', routes);

// Error handler
app.use(errorMiddleware);

// Start server
app.listen(config.port, () => {
  console.log(`📝 Post Service running on port ${config.port}`);
});

export default app;

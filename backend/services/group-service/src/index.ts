import express from 'express';
import cors from 'cors';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'group-service' });
});

// API Routes
app.use('/api/groups', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`👥 Group Service running on port ${config.port}`);
});

export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import groupRoutes from './routes/groups';
import postRoutes from './routes/posts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'group-service' });
});

// Routes
app.use('/api/groups', groupRoutes);
app.use('/api/groups', postRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`👥 Group Service running on port ${PORT}`);
});

export default app;

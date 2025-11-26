import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'post-service' });
});

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`📝 Post Service running on port ${PORT}`);
});

export default app;

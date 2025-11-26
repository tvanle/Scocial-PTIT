import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mediaRoutes from './routes/media';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Serve static files for local storage
const uploadsDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadsDir)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'media-service' });
});

// Routes
app.use('/api/media', mediaRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  if (err.message === 'File type not allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('File too large')) {
    return res.status(400).json({ error: 'File size exceeds limit' });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`📁 Media Service running on port ${PORT}`);
});

export default app;

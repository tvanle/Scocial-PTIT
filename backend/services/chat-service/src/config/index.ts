import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ptit_chat',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  env: process.env.NODE_ENV || 'development',
};

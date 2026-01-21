import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3007,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
} as const;

export default config;

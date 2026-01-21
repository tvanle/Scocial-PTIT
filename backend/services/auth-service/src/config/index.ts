import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    accessTokenExpiry: '1d',
    refreshTokenExpiry: '7d',
  },

  // Password hashing
  bcrypt: {
    saltRounds: 12,
  },
} as const;

export type Config = typeof config;

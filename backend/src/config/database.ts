import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './index';

// Prisma Client (PostgreSQL)
export const prisma = new PrismaClient({
  log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
});

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis Client
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

// Graceful shutdown
export const disconnectDatabases = async (): Promise<void> => {
  await prisma.$disconnect();
  await mongoose.disconnect();
  await redis.quit();
  console.log('📴 All database connections closed');
};

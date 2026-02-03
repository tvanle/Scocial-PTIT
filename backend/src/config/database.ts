import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from './index';

// Prisma Client (PostgreSQL)
export const prisma = new PrismaClient({
  log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
});

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
  await redis.quit();
  console.log('📴 All database connections closed');
};

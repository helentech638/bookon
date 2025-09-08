import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  // Performance optimizations
  __internal: {
    engine: {
      // Enable connection pooling
      connectionLimit: 10,
      // Reduce connection timeout
      connectTimeout: 10000,
      // Enable query optimization
      enableQueryOptimization: true,
    },
  },
});

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

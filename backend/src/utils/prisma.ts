import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection retry configuration
const createPrismaClient = () => {
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  return new PrismaClient({
    log: isProduction ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        // Always use pooled connection URL for regular operations
        // DATABASE_DIRECT_URL should only be used for migrations and seeding
        url: process.env['DATABASE_URL'] || '',
      },
    },
    // Add error handling for connection issues
    errorFormat: 'minimal',
    // Add connection pool configuration for better reliability
    __internal: {
      engine: {
        connectTimeout: 30000, // 30 seconds
        poolTimeout: 30000,    // 30 seconds
        connectionLimit: 5,    // Reduce connection limit to prevent pool exhaustion
        // Disable prepared statements in production/serverless to avoid caching issues
        ...(isProduction && { preparedStatements: false }),
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Add connection error handling
// prisma.$on('error', (e) => {
//   console.error('Prisma error:', e);
// });

// Graceful shutdown
if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Debug function to check which database URL is being used
export const getDatabaseInfo = () => {
  const dbUrl = process.env['DATABASE_URL'];
  const directUrl = process.env['DATABASE_DIRECT_URL'];
  
  return {
    hasPooledUrl: !!dbUrl,
    hasDirectUrl: !!directUrl,
    pooledUrlType: dbUrl?.includes('pooler') ? 'pooled' : 'direct',
    directUrlType: directUrl?.includes('pooler') ? 'pooled' : 'direct',
    // Don't log full URLs for security
    pooledUrlPreview: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'NOT_SET',
    directUrlPreview: directUrl ? `${directUrl.substring(0, 20)}...` : 'NOT_SET'
  };
};

// Wrapper function to handle prepared statement errors
export const safePrismaQuery = async <T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> => {
  try {
    return await queryFn(prisma);
  } catch (error: any) {
    // Check if it's any type of prepared statement error
    const isPreparedStatementError = error.message && (
      error.message.includes('prepared statement') ||
      error.code === '42P05' || // prepared statement already exists
      error.code === '26000' || // prepared statement does not exist
      error.code === '08P01'    // bind message parameter mismatch
    );
    
    if (isPreparedStatementError) {
      console.warn('Prepared statement error detected, retrying with fresh connection...', {
        errorCode: error.code,
        errorMessage: error.message?.substring(0, 100)
      });
      
      // Create a fresh Prisma client instance
      const freshClient = createPrismaClient();
      
      try {
        const result = await queryFn(freshClient);
        // Close the fresh client
        await freshClient.$disconnect();
        return result;
      } catch (retryError) {
        await freshClient.$disconnect();
        throw retryError;
      }
    }
    
    throw error;
  }
};

export default prisma;

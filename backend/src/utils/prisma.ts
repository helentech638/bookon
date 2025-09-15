import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection retry configuration
const createPrismaClient = () => {
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  // Modify database URL to disable prepared statements in production
  let databaseUrl = process.env['DATABASE_URL'] || '';
  if (isProduction && databaseUrl) {
    // Add parameters to disable prepared statements (matching your working second project)
    const url = new URL(databaseUrl);
    url.searchParams.set('prepared', 'false');  // Use 'prepared' instead of 'prepared_statements'
    url.searchParams.set('pgbouncer', 'true'); // Enable pgbouncer
    url.searchParams.set('connection_limit', '5'); // Reduce connection limit for serverless
    url.searchParams.set('pool_timeout', '10'); // Reduce pool timeout
    url.searchParams.set('sslmode', 'disable'); // Disable SSL for serverless environments
    url.searchParams.set('connect_timeout', '10'); // Add connection timeout
    url.searchParams.set('statement_timeout', '30000'); // Add statement timeout
    databaseUrl = url.toString();
  }
  
  return new PrismaClient({
    log: isProduction ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        // Always use pooled connection URL for regular operations
        // DATABASE_DIRECT_URL should only be used for migrations and seeding
        url: databaseUrl,
      },
    },
    // Add error handling for connection issues
    errorFormat: 'minimal',
    // Add connection pool configuration for better reliability
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds - reduced for serverless
        poolTimeout: 10000,    // 10 seconds - reduced for serverless
        connectionLimit: 3,    // Further reduce connection limit for serverless
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

// Wrapper function to handle prepared statement errors and SSL issues
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
    
    // Check if it's an SSL certificate error
    const isSSLError = error.message && (
      error.message.includes('SELF_SIGNED_CERT_IN_CHAIN') ||
      error.message.includes('certificate') ||
      error.message.includes('SSL') ||
      error.code === 'SELF_SIGNED_CERT_IN_CHAIN'
    );
    
    // Check if it's a connection pool error
    const isConnectionPoolError = error.message && (
      error.message.includes('connection pool') ||
      error.message.includes('Timed out fetching a new connection') ||
      error.message.includes('connection_limit') ||
      error.message.includes('pool_timeout')
    );
    
    if (isPreparedStatementError || isSSLError || isConnectionPoolError) {
      console.warn('Database connection error detected, retrying with fresh connection...', {
        errorCode: error.code,
        errorMessage: error.message?.substring(0, 100),
        errorType: isPreparedStatementError ? 'prepared_statement' : 
                   isSSLError ? 'ssl_certificate' : 'connection_pool'
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

// Connection cleanup function for serverless environments
export const cleanupConnections = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connections cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up database connections:', error);
  }
};

// Add process cleanup handlers for serverless environments
if (process.env['NODE_ENV'] === 'production') {
  process.on('SIGTERM', cleanupConnections);
  process.on('SIGINT', cleanupConnections);
  process.on('beforeExit', cleanupConnections);
}

export default prisma;

import knex from 'knex';
import { logger } from './logger';

// Database configuration with Neon support
const getDbConfig = () => {
  // If DATABASE_URL is provided (Neon), use it directly
  if (process.env['DATABASE_URL']) {
    return {
      client: 'postgresql',
      connection: process.env['DATABASE_URL'],
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
      pool: {
        min: parseInt(process.env['DB_POOL_MIN'] || '2'),
        max: parseInt(process.env['DB_POOL_MAX'] || '10'),
        acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
        createTimeoutMillis: parseInt(process.env['DB_CREATE_TIMEOUT'] || '30000'),
        destroyTimeoutMillis: parseInt(process.env['DB_DESTROY_TIMEOUT'] || '5000'),
        idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
        reapIntervalMillis: parseInt(process.env['DB_REAP_INTERVAL'] || '1000'),
        createRetryIntervalMillis: parseInt(process.env['DB_CREATE_RETRY_INTERVAL'] || '200'),
      },
      migrations: {
        directory: './src/migrations',
        tableName: 'knex_migrations',
      },
      seeds: {
        directory: './src/seeds',
      },
      debug: process.env['NODE_ENV'] === 'development',
      log: {
        warn(message: string) {
          logger.warn(`Database: ${message}`);
        },
        error(message: string) {
          logger.error(`Database: ${message}`);
        },
        deprecate(message: string) {
          logger.warn(`Database Deprecation: ${message}`);
        },
        debug(message: string) {
          if (process.env['NODE_ENV'] === 'development') {
            logger.debug(`Database: ${message}`);
          }
        },
      },
    };
  }

  // Fallback to individual environment variables
  return {
    client: 'postgresql',
    connection: {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      user: process.env['DB_USER'] || 'bookon_user',
      password: process.env['DB_PASSWORD'] || 'bookon_password',
      database: process.env['DB_NAME'] || 'bookon',
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env['DB_POOL_MIN'] || '2'),
      max: parseInt(process.env['DB_POOL_MAX'] || '10'),
      acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
      createTimeoutMillis: parseInt(process.env['DB_CREATE_TIMEOUT'] || '30000'),
      destroyTimeoutMillis: parseInt(process.env['DB_DESTROY_TIMEOUT'] || '5000'),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
      reapIntervalMillis: parseInt(process.env['DB_REAP_INTERVAL'] || '1000'),
      createRetryIntervalMillis: parseInt(process.env['DB_CREATE_RETRY_INTERVAL'] || '200'),
    },
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
    debug: process.env['NODE_ENV'] === 'development',
    log: {
      warn(message: string) {
        logger.warn(`Database: ${message}`);
      },
      error(message: string) {
        logger.error(`Database: ${message}`);
      },
      deprecate(message: string) {
        logger.warn(`Database Deprecation: ${message}`);
      },
      debug(message: string) {
        if (process.env['NODE_ENV'] === 'development') {
          logger.debug(`Database: ${message}`);
        }
      },
    },
  };
};

const dbConfig = getDbConfig();

// Create Knex instance
export const db = knex(dbConfig);

// Database connection function
export const connectDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    logger.info('✅ Database connection established successfully');
    
    // Log database info
    const result = await db.raw('SELECT version()');
    logger.info(`📊 PostgreSQL version: ${result.rows[0].version}`);
    
    // Check if migrations table exists
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    if (hasMigrationsTable) {
      logger.info('✅ Database migrations table found - migrations already completed');
    } else {
      logger.info('⚠️ No migrations table found - please run migrations manually first');
    }
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown function
export const closeDatabase = async (): Promise<void> => {
  try {
    await db.destroy();
    logger.info('✅ Database connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    return false;
  }
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    const stats = await db.raw(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `);
    
    return {
      tables: stats.rows.length,
      stats: stats.rows,
    };
  } catch (error) {
    logger.error('❌ Error getting database stats:', error);
    return null;
  }
};

// Export the database instance
export default db;

import { logger } from './logger';

// Mock Redis implementation for development
class MockRedis {
  private store: Map<string, { value: string; expiry: number }> = new Map();

  async ping(): Promise<string> {
    return 'PONG';
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    const expiry = Date.now() + (ttl * 1000);
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiry: 0 });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = this.store.get(key);
    const value = current ? parseInt(current.value) + 1 : 1;
    this.store.set(key, { value: value.toString(), expiry: 0 });
    return value;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expiry = Date.now() + (seconds * 1000);
      this.store.set(key, item);
      return 1;
    }
    return 0;
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }

  multi(): any {
    return {
      incr: () => this,
      expire: () => this,
      exec: async () => [[null, 1], [null, 3600]]
    };
  }

  on(_event: string, _callback: Function): void {
    // Mock event system
  }
}

// Create mock Redis instance
export const redis = new MockRedis();

// Redis connection function
export const connectRedis = async (): Promise<void> => {
  try {
    // Wait for Redis to be ready
    await redis.ping();
    logger.info('✅ Mock Redis connection established successfully');
  } catch (error) {
    logger.warn('⚠️ Mock Redis connection failed, continuing without Redis:', error);
    // Don't throw error, just log warning
  }
};

// Graceful shutdown function
export const closeRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('✅ Redis connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
  }
};

// Health check function
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('❌ Redis health check failed:', error);
    return false;
  }
};

// Cache utility functions
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch (error) {
    logger.error(`❌ Error getting cache key ${key}:`, error);
    return null;
  }
};

export const cacheSet = async (
  key: string, 
  value: string, 
  ttl?: number
): Promise<boolean> => {
  try {
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error(`❌ Error setting cache key ${key}:`, error);
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    logger.error(`❌ Error deleting cache key ${key}:`, error);
    return false;
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`❌ Error checking cache key ${key}:`, error);
    return false;
  }
};

// Session management functions
export const setSession = async (
  sessionId: string, 
  data: any, 
  ttl: number = 3600
): Promise<boolean> => {
  try {
    await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error(`❌ Error setting session ${sessionId}:`, error);
    return false;
  }
};

export const getSession = async (sessionId: string): Promise<any | null> => {
  try {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`❌ Error getting session ${sessionId}:`, error);
    return null;
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const result = await redis.del(`session:${sessionId}`);
    return result > 0;
  } catch (error) {
    logger.error(`❌ Error deleting session ${sessionId}:`, error);
    return false;
  }
};

// Rate limiting functions
export const incrementRateLimit = async (
  key: string, 
  ttl: number = 3600
): Promise<number> => {
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();
    return results?.[0]?.[1] as number || 0;
  } catch (error) {
    logger.error(`❌ Error incrementing rate limit ${key}:`, error);
    return 0;
  }
};

export const getRateLimit = async (key: string): Promise<number> => {
  try {
    const result = await redis.get(key);
    return result ? parseInt(result) : 0;
  } catch (error) {
    logger.error(`❌ Error getting rate limit ${key}:`, error);
    return 0;
  }
};

// Export the Redis instance
export default redis;

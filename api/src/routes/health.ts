import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma, checkDatabaseConnection } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    // Get basic system info
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      database: {
        connected: dbConnected,
        url: process.env['DATABASE_URL'] ? 'configured' : 'not configured'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    const responseTime = Date.now() - startTime;
    
    logger.info('Health check completed', { 
      responseTime, 
      dbConnected,
      memoryUsage: systemInfo.memory.used 
    });

    res.json({
      success: true,
      data: systemInfo,
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }
}));

// Database health check
router.get('/database', asyncHandler(async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Test basic database operations
    const [userCount, venueCount, activityCount, bookingCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.venue.count().catch(() => 0),
      prisma.activity.count().catch(() => 0),
      prisma.booking.count().catch(() => 0)
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        connected: true,
        responseTime: `${responseTime}ms`,
        counts: {
          users: userCount,
          venues: venueCount,
          activities: activityCount,
          bookings: bookingCount
        }
      }
    });
  } catch (error) {
    logger.error('Database health check failed:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Database connection failed',
        code: 'DATABASE_HEALTH_ERROR',
        details: process.env['NODE_ENV'] === 'development' ? error : undefined
      }
    });
  }
}));

export default router;

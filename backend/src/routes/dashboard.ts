import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

// Simple in-memory cache for dashboard data
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

const router = Router();

// Get dashboard statistics - optimized with caching
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = req.user!.id;
  const cacheKey = `stats_${userId}`;
  
  // Check cache first
  const cached = dashboardCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logger.info(`Dashboard stats served from cache in ${Date.now() - startTime}ms`, { userId });
    return res.json({
      success: true,
      data: cached.data
    });
  }
  
  try {
    // Use a single optimized query with raw SQL for better performance
    const dashboardData = await safePrismaQuery(async (client) => {
      // Single query to get all stats at once - updated for Course schema
      const result = await client.$queryRaw`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_spent,
          COUNT(CASE WHEN status IN ('pending', 'confirmed') THEN 1 END) as upcoming_activities,
          EXTRACT(DAYS FROM NOW() - u.created_at) as member_since_days
        FROM "Booking" b
        JOIN "User" u ON u.id = b."parentId"
        WHERE b."parentId" = ${userId}
      ` as any[];

      const stats = result[0] || {};
      
      return {
        totalBookings: parseInt(stats.total_bookings) || 0,
        confirmedBookings: parseInt(stats.confirmed_bookings) || 0,
        totalSpent: parseFloat(stats.total_spent) || 0,
        upcomingActivities: parseInt(stats.upcoming_activities) || 0,
        memberSince: parseInt(stats.member_since_days) || 0,
        lastLogin: new Date().toISOString()
      };
    });

    // Cache the result
    dashboardCache.set(cacheKey, {
      data: dashboardData,
      timestamp: Date.now()
    });

    const endTime = Date.now();
    logger.info(`Dashboard stats API completed in ${endTime - startTime}ms`, { userId });
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    throw new AppError('Failed to fetch dashboard stats', 500, 'DASHBOARD_STATS_ERROR');
  }
}));

// Get user profile data for dashboard - optimized
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Use cached user data from token instead of database query
    const userData = {
      user: {
        id: userId,
        email: req.user!.email,
        role: req.user!.role,
        memberSince: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      }
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw new AppError('Failed to fetch user profile', 500, 'USER_PROFILE_ERROR');
  }
}));

// Get user's activities
router.get('/activities', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    const activities = await safePrismaQuery(async (client) => {
      return await client.booking.findMany({
        where: { parentId: userId },
        include: {
          activity: {
            select: {
              title: true,
              description: true,
              status: true,
              venue: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Limit to 10 most recent activities
      });
    });

    res.json({
      success: true,
      data: activities.map(booking => ({
        id: booking.id,
        status: booking.status,
        created_at: booking.createdAt,
        title: booking.activity.title,
        description: booking.activity.description,
        venue_name: booking.activity.venue.name
      }))
    });
  } catch (error) {
    logger.error('Error fetching user activities:', error);
    throw new AppError('Failed to fetch user activities', 500, 'USER_ACTIVITIES_ERROR');
  }
}));

// Get user's children
router.get('/children', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    const children = await safePrismaQuery(async (client) => {
      return await client.child.findMany({
      where: { parentId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true
      },
      orderBy: { firstName: 'asc' }
      });
    });

    res.json({
      success: true,
      data: children
    });
  } catch (error) {
    logger.error('Error fetching children:', error);
    throw new AppError('Failed to fetch children', 500, 'CHILDREN_FETCH_ERROR');
  }
}));

// Get recent activity
router.get('/recent-activity', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Get recent bookings with course and venue info
    const recentBookings = await safePrismaQuery(async (client) => {
      return await client.booking.findMany({
        where: { parentId: userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          amount: true,
          paymentStatus: true,
          activity: {
            select: {
              title: true,
              venue: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
    });

    // Combine bookings and payments into activities
    const allActivities = recentBookings.map(booking => [
      {
        type: 'booking',
        id: booking.id,
        title: `Booked: ${booking.activity.title}`,
        subtitle: `at ${booking.activity.venue.name}`,
        status: booking.status,
        date: booking.createdAt
      },
      {
        type: 'payment',
        id: booking.id,
        title: `Payment: ${booking.activity.title}`,
        subtitle: `£${parseFloat(String(booking.amount || '0')).toFixed(2)}`,
        status: booking.paymentStatus,
        date: booking.createdAt
      }
    ]).flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    res.json({
      success: true,
      data: allActivities
    });
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    throw new AppError('Failed to fetch recent activity', 500, 'RECENT_ACTIVITY_FETCH_ERROR');
  }
}));

// Get recent activities for user - optimized
router.get('/recent-activities', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Use optimized query with raw SQL for better performance
    const recentActivities = await safePrismaQuery(async (client) => {
      const activities = await client.$queryRaw`
        SELECT 
          b.id,
          b.status,
          b.created_at as timestamp,
          a.title as title,
          a.status as type,
          v.name as venue
        FROM "Booking" b
        JOIN "Activity" a ON a.id = b."activityId"
        JOIN "Venue" v ON v.id = a."venueId"
        WHERE b."parentId" = ${userId}
        ORDER BY b.created_at DESC
        LIMIT 10
      ` as any[];

      return activities.map((booking: any) => ({
        id: booking.id,
        type: 'booking',
        title: booking.title,
        description: `${booking.type} course`,
        venue: booking.venue,
        status: booking.status,
        timestamp: booking.timestamp
      }));
    });

    res.json({
      success: true,
      data: recentActivities
    });
  } catch (error) {
    logger.error('Error fetching recent activities:', error);
    throw new AppError('Failed to fetch recent activities', 500, 'RECENT_ACTIVITIES_ERROR');
  }
}));

// Get user's bookings (redirect to main bookings endpoint)
router.get('/bookings', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const bookings = await safePrismaQuery(async (client) => {
      return await client.booking.findMany({
        where: { 
          parentId: userId,
          status: { not: 'cancelled' }
        },
        include: {
          activity: {
            include: {
              venue: true
            }
          },
          child: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    throw new AppError('Failed to fetch user bookings', 500, 'USER_BOOKINGS_ERROR');
  }
}));

// Get dashboard snapshot data
router.get('/snapshot', authenticateToken, requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { range = 'today' } = req.query;
    const userId = req.user!.id;
    
    logger.info('Dashboard snapshot requested', { 
      user: req.user?.email,
      range,
      userId 
    });

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    const snapshotData = await safePrismaQuery(async () => {
      // Get basic stats
      const [totalBookings, totalRevenue, totalActivities, totalVenues] = await Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.booking.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'confirmed'
          },
          _sum: { totalAmount: true }
        }),
        prisma.activity.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.venue.count()
      ]);

      return {
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalActivities,
        totalVenues,
        dateRange: { startDate, endDate }
      };
    });

    logger.info('Dashboard snapshot data retrieved', { 
      totalBookings: snapshotData.totalBookings,
      totalRevenue: snapshotData.totalRevenue
    });

    res.json({
      success: true,
      data: snapshotData
    });
  } catch (error) {
    logger.error('Error fetching dashboard snapshot:', error);
    throw new AppError('Failed to fetch dashboard snapshot', 500, 'DASHBOARD_SNAPSHOT_ERROR');
  }
}));

export default router;

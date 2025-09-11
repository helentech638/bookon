import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get upcoming activities
router.get('/upcoming', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;
    const userId = req.user!.id;
    
    logger.info('Upcoming activities requested', { 
      user: req.user?.email,
      limit,
      userId 
    });

    const upcomingActivities = await safePrismaQuery(async (client) => {
      const now = new Date();
      
      return await client.activity.findMany({
        where: {
          startDate: {
            gte: now
          },
          isActive: true
        },
        include: {
          venue: {
            select: {
              name: true
            }
          },
          bookings: {
            where: {
              status: 'confirmed'
            },
            select: {
              id: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        },
        take: parseInt(limit as string)
      });
    });

    // Transform the data to match the frontend interface
    const transformedActivities = upcomingActivities.map(activity => ({
      id: activity.id,
      name: activity.title,
      start_time: activity.startDate.toISOString(),
      end_time: activity.endDate.toISOString(),
      venue_name: activity.venue.name,
      capacity: activity.capacity,
      booked: activity.bookings.length,
      waitlist_count: Math.max(0, activity.bookings.length - activity.capacity)
    }));

    logger.info('Upcoming activities retrieved', { 
      count: transformedActivities.length 
    });

    res.json({
      success: true,
      data: transformedActivities
    });
  } catch (error) {
    logger.error('Error fetching upcoming activities:', error);
    throw new AppError('Failed to fetch upcoming activities', 500, 'UPCOMING_ACTIVITIES_ERROR');
  }
}));

export default router;

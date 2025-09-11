import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get all activities
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      type,
      venueId,
      status,
      dateFrom,
      dateTo
    } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (type) where.type = type;
    if (venueId) where.venueId = venueId;
    if (status) where.status = status;
    
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = new Date(dateFrom as string);
      if (dateTo) where.startDate.lte = new Date(dateTo as string);
    }

    const [activities, total] = await Promise.all([
      safePrismaQuery(async (client) => {
        return await client.activity.findMany({
          where,
          include: {
            venue: {
              select: { name: true, city: true, address: true }
            },
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            _count: {
              select: { bookings: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        });
      }),
      safePrismaQuery(async (client) => {
        return await client.activity.count({ where });
      })
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    throw new AppError('Failed to fetch activities', 500, 'ACTIVITIES_FETCH_ERROR');
  }
}));

// Get single activity
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.findUnique({
        where: { id },
        include: {
          venue: {
            select: { 
              name: true, 
              city: true, 
              address: true,
              capacity: true,
              phone: true,
              email: true
            }
          },
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          bookings: {
            include: {
              child: {
                select: { firstName: true, lastName: true, yearGroup: true }
              },
              parent: {
                select: { firstName: true, lastName: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          registers: {
            include: {
              child: {
                select: { firstName: true, lastName: true, yearGroup: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Error fetching activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch activity', 500, 'ACTIVITY_FETCH_ERROR');
  }
}));

// Create new activity
router.post('/', authenticateToken, requireRole(['admin', 'coordinator']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      title,
      type,
      venueId,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      price,
      earlyDropoff,
      earlyDropoffPrice,
      latePickup,
      latePickupPrice,
      generateSessions,
      excludeDates
    } = req.body;

    // Validate required fields
    if (!title || !type || !venueId || !startDate || !endDate || !startTime || !endTime) {
      throw new AppError('Missing required fields', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Validate venue exists
    const venue = await safePrismaQuery(async (client) => {
      return await client.venue.findUnique({
        where: { id: venueId }
      });
    });

    if (!venue) {
      throw new AppError('Venue not found', 404, 'VENUE_NOT_FOUND');
    }

    // Create activity
    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.create({
        data: {
          title,
          type,
          venueId,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          startTime,
          endTime,
          capacity: capacity ? parseInt(capacity) : null,
          price: price ? parseFloat(price) : 0,
          earlyDropoff: earlyDropoff || false,
          earlyDropoffPrice: earlyDropoffPrice ? parseFloat(earlyDropoffPrice) : null,
          latePickup: latePickup || false,
          latePickupPrice: latePickupPrice ? parseFloat(latePickupPrice) : null,
          createdBy: req.user!.id
        },
        include: {
          venue: {
            select: { name: true, city: true, address: true }
          },
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });
    });

    // Generate sessions if requested
    if (generateSessions && type === 'afterschool') {
      await generateWeeklySessions(activity.id, startDate, endDate, startTime, endTime, excludeDates);
    }

    logger.info('Activity created', {
      activityId: activity.id,
      title: activity.title,
      type: activity.type,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    logger.error('Error creating activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create activity', 500, 'ACTIVITY_CREATE_ERROR');
  }
}));

// Update activity
router.put('/:id', authenticateToken, requireRole(['admin', 'coordinator']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      venueId,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      price,
      earlyDropoff,
      earlyDropoffPrice,
      latePickup,
      latePickupPrice,
      status
    } = req.body;

    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(type && { type }),
          ...(venueId && { venueId }),
          ...(description !== undefined && { description }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(earlyDropoff !== undefined && { earlyDropoff }),
          ...(earlyDropoffPrice !== undefined && { earlyDropoffPrice: earlyDropoffPrice ? parseFloat(earlyDropoffPrice) : null }),
          ...(latePickup !== undefined && { latePickup }),
          ...(latePickupPrice !== undefined && { latePickupPrice: latePickupPrice ? parseFloat(latePickupPrice) : null }),
          ...(status && { status })
        },
        include: {
          venue: {
            select: { name: true, city: true, address: true }
          },
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });
    });

    logger.info('Activity updated', {
      activityId: activity.id,
      title: activity.title,
      updatedBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    logger.error('Error updating activity:', error);
    if (error.code === 'P2025') {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }
    throw new AppError('Failed to update activity', 500, 'ACTIVITY_UPDATE_ERROR');
  }
}));

// Delete activity
router.delete('/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await safePrismaQuery(async (client) => {
      return await client.activity.delete({
        where: { id }
      });
    });

    logger.info('Activity deleted', {
      activityId: id,
      deletedBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting activity:', error);
    if (error.code === 'P2025') {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }
    throw new AppError('Failed to delete activity', 500, 'ACTIVITY_DELETE_ERROR');
  }
}));

// Get upcoming activities
router.get('/upcoming', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;

    const activities = await safePrismaQuery(async (client) => {
      return await client.activity.findMany({
        where: {
          isActive: true,
          startDate: {
            gte: new Date() // Only future activities
          }
        },
        include: {
          venue: {
            select: {
              name: true,
              city: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        take: parseInt(limit as string)
      });
    });

    res.json({
      success: true,
      data: activities.map(activity => ({
        id: activity.id,
        name: activity.title,
        startDate: activity.startDate,
        endDate: activity.endDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        venue: activity.venue.name,
        capacity: activity.capacity,
        price: parseFloat(activity.price.toString()),
        status: activity.status
      }))
    });
  } catch (error) {
    logger.error('Error fetching upcoming activities:', error);
    throw new AppError('Failed to fetch upcoming activities', 500, 'UPCOMING_ACTIVITIES_ERROR');
  }
}));

// Generate sessions for recurring activities
async function generateWeeklySessions(
  activityId: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  excludeDates?: string[]
): Promise<void> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sessions = [];

    // Get the day of week from start date
    const dayOfWeek = start.getDay();
    const excludeDatesSet = new Set(excludeDates || []);

    // Generate sessions for each week
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 7)) {
      const sessionDate = new Date(date);
      const dateString = sessionDate.toISOString().split('T')[0];

      // Skip if date is in exclude list
      if (excludeDatesSet.has(dateString)) {
        continue;
      }

      sessions.push({
        activityId,
        date: sessionDate,
        startTime,
        endTime,
        status: 'scheduled'
      });
    }

    if (sessions.length > 0) {
      await safePrismaQuery(async (client) => {
        return await client.session.createMany({
          data: sessions
        });
      });

      logger.info('Generated sessions for activity', {
        activityId,
        sessionCount: sessions.length
      });
    }
  } catch (error) {
    logger.error('Error generating sessions:', error);
    throw error;
  }
}

export default router;
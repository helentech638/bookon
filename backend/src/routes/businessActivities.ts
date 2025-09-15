import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business activities
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, type, venue, status, page = 1, limit = 20 } = req.query;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Build where clause
    const where: any = {
      venueId: { in: venueIds }
    };

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (venue) {
      where.venueId = venue;
    }

    if (status) {
      where.status = status;
    }

    // Get activities with pagination
    const activities = await safePrismaQuery(async (client) => {
      return await client.activity.findMany({
        where,
        include: {
          venue: {
            select: { id: true, name: true }
          },
          bookings: {
            where: { status: 'confirmed' },
            select: { id: true }
          },
          _count: {
            select: {
              bookings: {
                where: { status: 'confirmed' }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });
    });

    // Get total count for pagination
    const totalCount = await safePrismaQuery(async (client) => {
      return await client.activity.count({ where });
    });

    // Format response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      name: activity.title,
      type: activity.type || 'After-School',
      venue: activity.venue.name,
      venueId: activity.venue.id,
      time: `${activity.startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${activity.endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`,
      capacity: activity.capacity || 20,
      booked: activity._count.bookings,
      status: activity.status || 'active',
      nextSession: activity.startDate.toISOString().split('T')[0],
      description: activity.description,
      price: activity.price,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    }));

    logger.info('Business activities fetched successfully', { 
      userId, 
      count: formattedActivities.length,
      totalCount 
    });

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        },
        venues: venues
      }
    });

  } catch (error) {
    logger.error('Error fetching business activities:', error);
    throw new AppError('Failed to fetch activities', 500, 'ACTIVITIES_ERROR');
  }
}));

// Get single activity
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const activityId = req.params.id;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Get activity
    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.findFirst({
        where: {
          id: activityId,
          venueId: { in: venueIds }
        },
        include: {
          venue: {
            select: { id: true, name: true, address: true }
          },
          bookings: {
            include: {
              child: {
                select: { firstName: true, lastName: true }
              },
              parent: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          _count: {
            select: {
              bookings: {
                where: { status: 'confirmed' }
              }
            }
          }
        }
      });
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    logger.info('Business activity fetched successfully', { userId, activityId });

    res.json({
      success: true,
      data: {
        activity: {
          id: activity.id,
          name: activity.title,
          type: activity.type || 'After-School',
          venue: activity.venue,
          startDate: activity.startDate,
          endDate: activity.endDate,
          capacity: activity.capacity || 20,
          booked: activity._count.bookings,
          status: activity.status || 'active',
          description: activity.description,
          price: activity.price,
          bookings: activity.bookings.map(booking => ({
            id: booking.id,
            childName: `${booking.child.firstName} ${booking.child.lastName}`,
            parentName: `${booking.parent.firstName} ${booking.parent.lastName}`,
            parentEmail: booking.parent.email,
            status: booking.status,
            createdAt: booking.createdAt
          })),
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business activity:', error);
    throw new AppError('Failed to fetch activity', 500, 'ACTIVITY_ERROR');
  }
}));

// Create new activity
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, type, venueId, startDate, endDate, capacity, price, description } = req.body;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Verify venue belongs to user
    const venue = await safePrismaQuery(async (client) => {
      return await client.venue.findFirst({
        where: {
          id: venueId,
          ownerId: userId
        }
      });
    });

    if (!venue) {
      throw new AppError('Venue not found or access denied', 404, 'VENUE_NOT_FOUND');
    }

    // Create activity
    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.create({
        data: {
          title: name,
          type: type || 'After-School',
          description: description || '',
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          capacity: capacity || 20,
          price: price || 0,
          venueId: venueId,
          status: 'active'
        },
        include: {
          venue: {
            select: { id: true, name: true }
          }
        }
      });
    });

    logger.info('Business activity created successfully', { userId, activityId: activity.id });

    res.status(201).json({
      success: true,
      data: {
        activity: {
          id: activity.id,
          name: activity.title,
          type: activity.type,
          venue: activity.venue.name,
          startDate: activity.startDate,
          endDate: activity.endDate,
          capacity: activity.capacity,
          price: activity.price,
          status: activity.status,
          createdAt: activity.createdAt
        }
      },
      message: 'Activity created successfully'
    });

  } catch (error) {
    logger.error('Error creating business activity:', error);
    throw new AppError('Failed to create activity', 500, 'ACTIVITY_CREATE_ERROR');
  }
}));

// Update activity
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const activityId = req.params.id;
  const { name, type, venueId, startDate, endDate, capacity, price, description, status } = req.body;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Check if activity exists and belongs to user
    const existingActivity = await safePrismaQuery(async (client) => {
      return await client.activity.findFirst({
        where: {
          id: activityId,
          venueId: { in: venueIds }
        }
      });
    });

    if (!existingActivity) {
      throw new AppError('Activity not found or access denied', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Update activity
    const activity = await safePrismaQuery(async (client) => {
      return await client.activity.update({
        where: { id: activityId },
        data: {
          title: name,
          type: type,
          description: description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          capacity: capacity,
          price: price,
          venueId: venueId,
          status: status
        },
        include: {
          venue: {
            select: { id: true, name: true }
          }
        }
      });
    });

    logger.info('Business activity updated successfully', { userId, activityId });

    res.json({
      success: true,
      data: {
        activity: {
          id: activity.id,
          name: activity.title,
          type: activity.type,
          venue: activity.venue.name,
          startDate: activity.startDate,
          endDate: activity.endDate,
          capacity: activity.capacity,
          price: activity.price,
          status: activity.status,
          updatedAt: activity.updatedAt
        }
      },
      message: 'Activity updated successfully'
    });

  } catch (error) {
    logger.error('Error updating business activity:', error);
    throw new AppError('Failed to update activity', 500, 'ACTIVITY_UPDATE_ERROR');
  }
}));

// Delete activity
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const activityId = req.params.id;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Check if activity exists and belongs to user
    const existingActivity = await safePrismaQuery(async (client) => {
      return await client.activity.findFirst({
        where: {
          id: activityId,
          venueId: { in: venueIds }
        },
        include: {
          _count: {
            select: {
              bookings: true
            }
          }
        }
      });
    });

    if (!existingActivity) {
      throw new AppError('Activity not found or access denied', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check if activity has bookings
    if (existingActivity._count.bookings > 0) {
      throw new AppError('Cannot delete activity with existing bookings', 400, 'ACTIVITY_HAS_BOOKINGS');
    }

    // Delete activity
    await safePrismaQuery(async (client) => {
      return await client.activity.delete({
        where: { id: activityId }
      });
    });

    logger.info('Business activity deleted successfully', { userId, activityId });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting business activity:', error);
    throw new AppError('Failed to delete activity', 500, 'ACTIVITY_DELETE_ERROR');
  }
}));

export default router;

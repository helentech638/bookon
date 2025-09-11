import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateActivity = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be HH:MM format'),
  body('capacity').isInt({ min: 1, max: 1000 }).withMessage('Capacity must be 1-1000'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('venueId').isUUID().withMessage('Venue ID must be a valid UUID'),
];

// Get all activities (public - no auth required)
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status = 'published',
      venueId,
      search,
      minPrice,
      maxPrice,
      dateFrom,
      dateTo
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereClause: any = {
      isActive: true
    };

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by venue
    if (venueId) {
      whereClause.venueId = venueId;
    }

    // Search by title or description
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Price range filter
    if (minPrice) {
      whereClause.price = { gte: parseFloat(minPrice as string) };
    }
    if (maxPrice) {
      whereClause.price = { 
        ...whereClause.price,
        lte: parseFloat(maxPrice as string) 
      };
    }

    // Date range filter
    if (dateFrom) {
      whereClause.startDate = { gte: new Date(dateFrom as string) };
    }
    if (dateTo) {
      whereClause.endDate = { lte: new Date(dateTo as string) };
    }

    // Get total count for pagination
    const totalCount = await prisma.activity.count({
      where: whereClause
    });

    // Get paginated results
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        venue: {
          select: {
            name: true,
            city: true,
            address: true
          }
        }
      },
      skip: offset,
      take: parseInt(limit as string),
      orderBy: { startDate: 'asc' }
    });

    res.json({
      success: true,
      data: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        capacity: activity.capacity,
        price: parseFloat(activity.price.toString()),
        status: activity.status,
        venue: {
          id: activity.venueId,
          name: activity.venue.name,
          city: activity.venue.city,
          address: activity.venue.address
        },
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    throw new AppError('Failed to fetch activities', 500, 'ACTIVITIES_FETCH_ERROR');
  }
}));

// Get upcoming activities
router.get('/upcoming', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;
    
    const activities = await prisma.activity.findMany({
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

// Get single activity by ID
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const activity = await prisma.activity.findFirst({
      where: {
        id: id,
        isActive: true
      },
      include: {
        venue: {
          select: {
            name: true,
            city: true,
            address: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        startTime: activity.startTime,
        endTime: activity.endTime,
        capacity: activity.capacity,
        price: parseFloat(activity.price.toString()),
        status: activity.status,
        venue: {
          id: activity.venueId,
          name: activity.venue.name,
          city: activity.venue.city,
          address: activity.venue.address,
          phone: activity.venue.phone,
          email: activity.venue.email
        },
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching activity:', error);
    throw new AppError('Failed to fetch activity', 500, 'ACTIVITY_FETCH_ERROR');
  }
}));

// Create new activity (admin/venue owner only)
router.post('/', authenticateToken, validateActivity, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if user has permission to create activities
    if (req.user!.role !== 'admin' && req.user!.role !== 'venue_owner') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      venue_id,
      name,
      description,
      duration,
      price,
      max_capacity,
      is_active = true
    } = req.body;

    // Verify venue exists and user has access
    const venue = await db('venues')
      .where('id', venue_id)
      .where('is_active', true)
      .first();

    if (!venue) {
      throw new AppError('Venue not found', 404, 'VENUE_NOT_FOUND');
    }

    // Create activity
    const [activity] = await db('activities')
      .insert({
        venue_id,
        name,
        description,
        duration,
        price,
        max_capacity,
        is_active
      })
      .returning(['id', 'name', 'venue_id']);

    logger.info('Activity created successfully', { 
      activityId: activity.id, 
      userId: req.user!.id,
      venueId: venue_id
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: {
        id: activity.id,
        name: activity.name,
        venue_id: activity.venue_id
      }
    });
  } catch (error) {
    logger.error('Error creating activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create activity', 500, 'ACTIVITY_CREATE_ERROR');
  }
}));

// Update activity (admin/venue owner only)
router.put('/:id', authenticateToken, validateActivity, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update activities
    if (req.user!.role !== 'admin' && req.user!.role !== 'venue_owner') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    // Check if activity exists
    const existingActivity = await db('activities')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingActivity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      price,
      venueId
    } = req.body;

    // Update activity
    const [updatedActivity] = await db('activities')
      .where('id', id)
      .update({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        capacity,
        price,
        venue_id: venueId,
        updated_at: new Date(),
      })
      .returning(['id', 'title', 'status']);

    logger.info('Activity updated successfully', { 
      activityId: id, 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: {
        id: updatedActivity.id,
        title: updatedActivity.title,
        status: updatedActivity.status
      }
    });
  } catch (error) {
    logger.error('Error updating activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update activity', 500, 'ACTIVITY_UPDATE_ERROR');
  }
}));

// Delete activity (admin/venue owner only)
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete activities
    if (req.user!.role !== 'admin' && req.user!.role !== 'venue_owner') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    // Check if activity exists
    const existingActivity = await db('activities')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingActivity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Soft delete - mark as inactive
    await db('activities')
      .where('id', id)
      .update({
        is_active: false,
        updated_at: new Date(),
      });

    logger.info('Activity deleted successfully', { 
      activityId: id, 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting activity:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete activity', 500, 'ACTIVITY_DELETE_ERROR');
  }
}));

// Publish/unpublish activity (admin/venue owner only)
router.patch('/:id/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'published', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    // Check if user has permission
    if (req.user!.role !== 'admin' && req.user!.role !== 'venue_owner') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    // Check if activity exists
    const existingActivity = await db('activities')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingActivity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Update status
    const [updatedActivity] = await db('activities')
      .where('id', id)
      .update({
        status,
        updated_at: new Date(),
      })
      .returning(['id', 'title', 'status']);

    logger.info('Activity status updated', { 
      activityId: id, 
      status, 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Activity status updated successfully',
      data: {
        id: updatedActivity.id,
        title: updatedActivity.title,
        status: updatedActivity.status
      }
    });
  } catch (error) {
    logger.error('Error updating activity status:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update activity status', 500, 'ACTIVITY_STATUS_UPDATE_ERROR');
  }
}));

export default router;

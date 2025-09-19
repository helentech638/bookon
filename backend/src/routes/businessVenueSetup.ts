import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Simple test route to check if venues exist
router.get('/test', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    logger.info('Testing venue fetch', { userId });
    
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        take: 5
      });
    });
    
    res.json({
      success: true,
      data: { venues, count: venues.length }
    });
  } catch (error) {
    logger.error('Test route error:', error);
    throw error;
  }
}));

// Get venue setups for business
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, status, page = 1, limit = 20 } = req.query;
  
  try {
    logger.info('Venue setup request', { userId, search, status, page, limit });
    
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    logger.info('User info retrieved', { userInfo });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      logger.warn('Business access denied', { userInfo });
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Build where clause
    const where: any = { ownerId: userId };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    // Get venue setups with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    logger.info('Fetching venues', { where, skip, limit });
    
    const [venueSetups, totalCount] = await safePrismaQuery(async (client) => {
      try {
        logger.info('Attempting to fetch venues from database');
        
        // Try with businessAccount relation first, fallback to simple query if it fails
        let venues;
        try {
          venues = await client.venue.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
              businessAccount: {
                select: {
                  id: true,
                  name: true,
                  stripeAccountId: true
                }
              }
            }
          });
        } catch (relationError) {
          logger.warn('BusinessAccount relation failed, falling back to simple query:', relationError);
          venues = await client.venue.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
          });
        }
        
        logger.info('Venues fetched successfully', { venueCount: venues.length });
        
        const count = await client.venue.count({ where });
        logger.info('Venue count retrieved', { count });
        
        return [venues, count];
      } catch (dbError) {
        logger.error('Database error in venue fetch:', dbError);
        throw dbError;
      }
    });

    logger.info('Venues fetched', { count: venueSetups.length, totalCount });

    res.status(200).json({
      success: true,
      data: {
        venueSetups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching venue setups:', error);
    throw error;
  }
}));

// Create new venue setup
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    address,
    city,
    postcode,
    phone,
    email,
    capacity,
    facilities,
    operatingHours,
    pricing,
    bookingRules,
    businessAccountId
  } = req.body;

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

    // Validate required fields
    if (!name || !address || !city || !postcode || !capacity) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Create venue setup
    const venueSetup = await safePrismaQuery(async (client) => {
      return await client.venue.create({
        data: {
          name,
          address,
          city,
          postcode,
          phone: phone || null,
          email: email || null,
          capacity: Number(capacity),
          facilities: facilities || [],
          operatingHours: operatingHours || null,
          pricing: pricing || null,
          bookingRules: bookingRules || null,
          businessAccountId: businessAccountId || null,
          ownerId: userId,
          isActive: true
        },
        include: {
          businessAccount: {
            select: {
              id: true,
              businessName: true,
              stripeAccountId: true
            }
          }
        }
      });
    });

    logger.info('Venue setup created', { venueSetupId: venueSetup.id, userId });

    res.status(201).json({
      success: true,
      message: 'Venue setup created successfully',
      data: venueSetup
    });

  } catch (error) {
    logger.error('Error creating venue setup:', error);
    throw error;
  }
}));

// Update venue setup
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const updateData = req.body;

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

    // Check if venue setup exists and belongs to user
    const existingVenue = await safePrismaQuery(async (client) => {
      return await client.venue.findFirst({
        where: { id, ownerId: userId }
      });
    });

    if (!existingVenue) {
      throw new AppError('Venue setup not found', 404, 'VENUE_SETUP_NOT_FOUND');
    }

    // Update venue setup
    const updatedVenue = await safePrismaQuery(async (client) => {
      return await client.venue.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          businessAccount: {
            select: {
              id: true,
              businessName: true,
              stripeAccountId: true
            }
          }
        }
      });
    });

    logger.info('Venue setup updated', { venueSetupId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Venue setup updated successfully',
      data: updatedVenue
    });

  } catch (error) {
    logger.error('Error updating venue setup:', error);
    throw error;
  }
}));

// Delete venue setup
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

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

    // Check if venue setup exists and belongs to user
    const existingVenue = await safePrismaQuery(async (client) => {
      return await client.venue.findFirst({
        where: { id, ownerId: userId }
      });
    });

    if (!existingVenue) {
      throw new AppError('Venue setup not found', 404, 'VENUE_SETUP_NOT_FOUND');
    }

    // Check if venue has any activities
    const activityCount = await safePrismaQuery(async (client) => {
      return await client.activity.count({
        where: { venueId: id }
      });
    });

    if (activityCount > 0) {
      throw new AppError('Cannot delete venue setup with existing activities', 400, 'VENUE_HAS_ACTIVITIES');
    }

    // Delete venue setup
    await safePrismaQuery(async (client) => {
      return await client.venue.delete({
        where: { id }
      });
    });

    logger.info('Venue setup deleted', { venueSetupId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Venue setup deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting venue setup:', error);
    throw error;
  }
}));

// Get venue setup by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

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

    // Get venue setup
    const venueSetup = await safePrismaQuery(async (client) => {
      return await client.venue.findFirst({
        where: { id, ownerId: userId },
        include: {
          businessAccount: {
            select: {
              id: true,
              businessName: true,
              stripeAccountId: true
            }
          }
        }
      });
    });

    if (!venueSetup) {
      throw new AppError('Venue setup not found', 404, 'VENUE_SETUP_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: venueSetup
    });

  } catch (error) {
    logger.error('Error fetching venue setup:', error);
    throw error;
  }
}));

export default router;

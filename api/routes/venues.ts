import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateVenue = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('address').trim().isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters'),
  body('city').trim().isLength({ min: 2, max: 50 }).withMessage('City must be 2-50 characters'),
  body('postcode').trim().isLength({ min: 3, max: 10 }).withMessage('Postcode must be 3-10 characters'),
  body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]+$/).withMessage('Invalid phone number'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
];

// Get all venues (public - no auth required)
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      city,
      search
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query = db('venues')
      .where('is_active', true);

    // Filter by city
    if (city) {
      query = query.where('city', 'ilike', `%${city}%`);
    }

    // Search by name or description
    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const totalCount = await countQuery.count('* as count').first();

    // Get paginated results
    const venues = await query
      .orderBy('name', 'asc')
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      success: true,
      data: venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        postcode: venue.postcode,
        phone: venue.phone,
        email: venue.email,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(String(totalCount?.['count'] || '0')),
        pages: Math.ceil(parseInt(String(totalCount?.['count'] || '0')) / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching venues:', error);
    throw new AppError('Failed to fetch venues', 500, 'VENUES_FETCH_ERROR');
  }
}));

// Get single venue by ID
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const venue = await db('venues')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!venue) {
      throw new AppError('Venue not found', 404, 'VENUE_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: venue.id,
        name: venue.name,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        postcode: venue.postcode,
        phone: venue.phone,
        email: venue.email,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      }
    });
  } catch (error) {
    logger.error('Error fetching venue:', error);
    throw new AppError('Failed to fetch venue', 500, 'VENUE_FETCH_ERROR');
  }
}));

// Create new venue (admin only)
router.post('/', authenticateToken, validateVenue, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if user has permission to create venues
    if (req.user!.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      name,
      description,
      address,
      city,
      postcode,
      phone,
      email
    } = req.body;

    const [venue] = await db('venues')
      .insert({
        name,
        description,
        address,
        city,
        postcode,
        phone,
        email,
        is_active: true,
      })
      .returning(['id', 'name']);

    logger.info('Venue created successfully', { 
      venueId: venue.id, 
      userId: req.user!.id 
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: {
        id: venue.id,
        name: venue.name
      }
    });
  } catch (error) {
    logger.error('Error creating venue:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create venue', 500, 'VENUE_CREATE_ERROR');
  }
}));

// Update venue (admin only)
router.put('/:id', authenticateToken, validateVenue, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update venues
    if (req.user!.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    // Check if venue exists
    const existingVenue = await db('venues')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingVenue) {
      throw new AppError('Venue not found', 404, 'VENUE_NOT_FOUND');
    }

    const {
      name,
      description,
      address,
      city,
      postcode,
      phone,
      email
    } = req.body;

    // Update venue
    const [updatedVenue] = await db('venues')
      .where('id', id)
      .update({
        name,
        description,
        address,
        city,
        postcode,
        phone,
        email,
        updated_at: new Date(),
      })
      .returning(['id', 'name']);

    logger.info('Venue updated successfully', { 
      venueId: id, 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: {
        id: updatedVenue.id,
        name: updatedVenue.name
      }
    });
  } catch (error) {
    logger.error('Error updating venue:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update venue', 500, 'VENUE_UPDATE_ERROR');
  }
}));

// Delete venue (admin only)
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete venues
    if (req.user!.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    // Check if venue exists
    const existingVenue = await db('venues')
      .where('id', id)
      .where('is_active', true)
      .first();

    if (!existingVenue) {
      throw new AppError('Venue not found', 404, 'VENUE_NOT_FOUND');
    }

    // Check if venue has active activities
    const activeActivities = await db('activities')
      .where('venue_id', id)
      .where('is_active', true)
      .first();

    if (activeActivities) {
      throw new AppError('Cannot delete venue with active activities', 400, 'VENUE_HAS_ACTIVITIES');
    }

    // Soft delete - mark as inactive
    await db('venues')
      .where('id', id)
      .update({
        is_active: false,
        updated_at: new Date(),
      });

    logger.info('Venue deleted successfully', { 
      venueId: id, 
      userId: req.user!.id 
    });

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting venue:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete venue', 500, 'VENUE_DELETE_ERROR');
  }
}));

export default router;

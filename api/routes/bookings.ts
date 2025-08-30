import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validateBooking = [
  body('activityId').isUUID().withMessage('Activity ID must be a valid UUID'),
  body('childId').isUUID().withMessage('Child ID must be a valid UUID'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
];

// Get all bookings for the authenticated user
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      page = '1', 
      limit = '10', 
      status,
      childId,
      activityId
    } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query = db('bookings')
      .select(
        'bookings.*',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time',
        'activities.end_time',
        'activities.price as activity_price',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'children.first_name as child_first_name',
        'children.last_name as child_last_name'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .join('children', 'bookings.child_id', 'children.id')
      .where('bookings.user_id', userId)
      .where('bookings.is_active', true);

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('bookings.status', status);
    }

    // Filter by child
    if (childId) {
      query = query.where('bookings.child_id', childId);
    }

    // Filter by activity
    if (activityId) {
      query = query.where('bookings.activity_id', activityId);
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const totalCount = await countQuery.count('* as count').first();

    // Get paginated results
    const bookings = await query
      .orderBy('bookings.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      success: true,
      data: bookings.map(booking => ({
        id: booking.id,
        child: {
          id: booking.child_id,
          name: `${booking.child_first_name} ${booking.child_last_name}`
        },
        activity: {
          id: booking.activity_id,
          title: booking.activity_title,
          startDate: booking.start_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          price: parseFloat(booking.activity_price)
        },
        venue: {
          name: booking.venue_name,
          city: booking.venue_city
        },
        status: booking.status,
        totalAmount: parseFloat(booking.total_amount),
        feeAmount: parseFloat(booking.fee_amount),
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(String(totalCount?.['count'] || '0')),
        pages: Math.ceil(parseInt(String(totalCount?.['count'] || '0')) / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    throw new AppError('Failed to fetch bookings', 500, 'BOOKINGS_FETCH_ERROR');
  }
}));

// Get single booking by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const booking = await db('bookings')
      .select(
        'bookings.*',
        'activities.title as activity_title',
        'activities.description as activity_description',
        'activities.start_date',
        'activities.end_date',
        'activities.start_time',
        'activities.end_time',
        'activities.price as activity_price',
        'activities.capacity',
        'venues.name as venue_name',
        'venues.city as venue_city',
        'venues.address as venue_address',
        'venues.phone as venue_phone',
        'children.first_name as child_first_name',
        'children.last_name as child_last_name',
        'children.date_of_birth as child_date_of_birth'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .join('children', 'bookings.child_id', 'children.id')
      .where('bookings.id', id)
      .where('bookings.user_id', userId)
      .where('bookings.is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: booking.id,
        child: {
          id: booking.child_id,
          name: `${booking.child_first_name} ${booking.child_last_name}`,
          dateOfBirth: booking.child_date_of_birth
        },
        activity: {
          id: booking.activity_id,
          title: booking.activity_title,
          description: booking.activity_description,
          startDate: booking.start_date,
          endDate: booking.end_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          price: parseFloat(booking.activity_price),
          capacity: booking.capacity
        },
        venue: {
          name: booking.venue_name,
          city: booking.venue_city,
          address: booking.venue_address,
          phone: booking.venue_phone
        },
        status: booking.status,
        totalAmount: parseFloat(booking.total_amount),
        feeAmount: parseFloat(booking.fee_amount),
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    throw new AppError('Failed to fetch booking', 500, 'BOOKING_FETCH_ERROR');
  }
}));

// Create new booking
router.post('/', authenticateToken, validateBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const {
      activityId,
      childId,
      notes
    } = req.body;

    // Check if activity exists and is available
    const activity = await db('activities')
      .where('id', activityId)
      .where('status', 'published')
      .where('is_active', true)
      .first();

    if (!activity) {
      throw new AppError('Activity not found or not available', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check if activity is in the future
    const now = new Date();
    const activityDate = new Date(activity.start_date);
    if (activityDate <= now) {
      throw new AppError('Cannot book past activities', 400, 'ACTIVITY_IN_PAST');
    }

    // Check if child belongs to user
    const child = await db('children')
      .where('id', childId)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!child) {
      throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
    }

    // Check if child is already booked for this activity
    const existingBooking = await db('bookings')
      .where('activity_id', activityId)
      .where('child_id', childId)
      .where('user_id', userId)
      .where('is_active', true)
      .whereIn('status', ['pending', 'confirmed'])
      .first();

    if (existingBooking) {
      throw new AppError('Child is already booked for this activity', 400, 'CHILD_ALREADY_BOOKED');
    }

    // Check activity capacity
    const currentBookings = await db('bookings')
      .where('activity_id', activityId)
      .where('is_active', true)
      .whereIn('status', ['pending', 'confirmed'])
      .count('* as count')
      .first();

    const currentCount = parseInt(String(currentBookings?.['count'] || '0'));
    if (currentCount >= activity.capacity) {
      throw new AppError('Activity is at full capacity', 400, 'ACTIVITY_FULL');
    }

    // Calculate total amount (activity price + platform fee)
    const platformFee = parseFloat(process.env['PLATFORM_FEE_PERCENTAGE'] || '10') / 100;
    const totalAmount = parseFloat(activity.price);
    const feeAmount = totalAmount * platformFee;
    const finalTotal = totalAmount + feeAmount;

    // Create booking
    const [booking] = await db('bookings')
      .insert({
        user_id: userId,
        activity_id: activityId,
        child_id: childId,
        status: 'pending',
        total_amount: finalTotal,
        fee_amount: feeAmount,
        notes,
        is_active: true,
      })
      .returning(['id', 'status', 'total_amount']);

    logger.info('Booking created successfully', { 
      bookingId: booking.id, 
      userId,
      activityId,
      childId
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id,
        status: booking.status,
        totalAmount: parseFloat(booking.total_amount)
      }
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create booking', 500, 'BOOKING_CREATE_ERROR');
  }
}));

// Update booking
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { notes, status } = req.body;
    
    // Check if booking exists and belongs to user
    const existingBooking = await db('bookings')
      .where('id', id)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!existingBooking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Only allow updates to pending bookings
    if (existingBooking.status !== 'pending') {
      throw new AppError('Cannot update confirmed or completed bookings', 400, 'BOOKING_NOT_EDITABLE');
    }

    // Update booking
    const [updatedBooking] = await db('bookings')
      .where('id', id)
      .update({
        notes,
        status: status || existingBooking.status,
        updated_at: new Date(),
      })
      .returning(['id', 'status', 'notes']);

    logger.info('Booking updated successfully', { 
      bookingId: id, 
      userId 
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        notes: updatedBooking.notes
      }
    });
  } catch (error) {
    logger.error('Error updating booking:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update booking', 500, 'BOOKING_UPDATE_ERROR');
  }
}));

// Booking amendment
router.put('/:id/amend', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      activity_date, 
      start_time, 
      end_time, 
      children_count, 
      special_requirements,
      venue_id,
      activity_id
    } = req.body;

    // Check if booking exists and user has permission
    const booking = await db('bookings')
      .where('id', id)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin/staff
    if (booking.user_id !== req.user!.id && !['admin', 'staff'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only amend your own bookings'
      });
    }

    // Check if booking can be amended (not too close to activity date)
    const activityDate = new Date(activity_date || booking.activity_date);
    const now = new Date();
    const hoursUntilActivity = (activityDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilActivity < 24) {
      return res.status(400).json({
        success: false,
        message: 'Bookings cannot be amended within 24 hours of the activity'
      });
    }

    // Validate venue and activity if changing
    if (venue_id && venue_id !== booking.venue_id) {
      const venue = await db('venues').where('id', venue_id).first();
      if (!venue) {
        return res.status(400).json({
          success: false,
          message: 'Invalid venue'
        });
      }
    }

    if (activity_id && activity_id !== booking.activity_id) {
      const activity = await db('activities').where('id', activity_id).first();
      if (!activity) {
        return res.status(400).json({
          success: false,
          message: 'Invalid activity'
        });
      }
    }

    // Calculate new amount if children count or activity changes
    let newAmount = booking.amount;
    if (children_count !== booking.children_count || activity_id !== booking.activity_id) {
      const activity = await db('activities')
        .where('id', activity_id || booking.activity_id)
        .first();
      
      if (activity) {
        newAmount = activity.price_per_child * children_count;
        // Add platform fees
        const platformFeePercentage = parseFloat(process.env['STRIPE_PLATFORM_FEE_PERCENTAGE'] || '2.9');
        const platformFeeFixed = parseFloat(process.env['STRIPE_PLATFORM_FEE_FIXED'] || '0.30');
        const platformFee = (newAmount * platformFeePercentage / 100) + platformFeeFixed;
        newAmount += platformFee;
      }
    }

    // Update booking
    const updatedBooking = await db('bookings')
      .where('id', id)
      .update({
        activity_date: activity_date || booking.activity_date,
        start_time: start_time || booking.start_time,
        end_time: end_time || booking.end_time,
        children_count: children_count || booking.children_count,
        special_requirements: special_requirements || booking.special_requirements,
        venue_id: venue_id || booking.venue_id,
        activity_id: activity_id || booking.activity_id,
        amount: newAmount,
        updated_at: new Date()
      })
      .returning('*');

    // Log the amendment
    await db('audit_logs').insert({
      user_id: req.user!.id,
      action_type: 'booking_amended',
      table_name: 'bookings',
      record_id: id,
      old_values: JSON.stringify(booking),
      new_values: JSON.stringify(updatedBooking[0]),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date()
    });

    return res.json({
      success: true,
      message: 'Booking amended successfully',
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('Error amending booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to amend booking'
    });
  }
}));

// Booking cancellation
router.put('/:id/cancel', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if booking exists and user has permission
    const booking = await db('bookings')
      .where('id', id)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin/staff
    if (booking.user_id !== req.user!.id && !['admin', 'staff'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    const activityDate = new Date(booking.activity_date);
    const now = new Date();
    const hoursUntilActivity = (activityDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Different cancellation policies based on time
    let refundPercentage = 0;
    let canCancel = true;

    if (hoursUntilActivity < 2) {
      canCancel = false;
    } else if (hoursUntilActivity < 24) {
      refundPercentage = 50;
    } else if (hoursUntilActivity < 72) {
      refundPercentage = 75;
    } else {
      refundPercentage = 100;
    }

    if (!canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Bookings cannot be cancelled within 2 hours of the activity'
      });
    }

    // Update booking status
    const updatedBooking = await db('bookings')
      .where('id', id)
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Log the cancellation
    await db('audit_logs').insert({
      user_id: req.user!.id,
      action_type: 'booking_cancelled',
      table_name: 'bookings',
      record_id: id,
      old_values: JSON.stringify(booking),
      new_values: JSON.stringify(updatedBooking[0]),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date()
    });

    // TODO: Process refund if applicable
    if (refundPercentage > 0 && booking.payment_intent_id) {
      // Implement refund logic here
      console.log(`Refund ${refundPercentage}% of ${booking.amount} for booking ${id}`);
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        ...updatedBooking[0],
        refundPercentage,
        canRefund: refundPercentage > 0
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
}));

// Booking rescheduling
router.put('/:id/reschedule', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { new_activity_date, new_start_time, new_end_time } = req.body;

    if (!new_activity_date) {
      return res.status(400).json({
        success: false,
        message: 'New activity date is required'
      });
    }

    // Check if booking exists and user has permission
    const booking = await db('bookings')
      .where('id', id)
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is admin/staff
    if (booking.user_id !== req.user!.id && !['admin', 'staff'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only reschedule your own bookings'
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a cancelled booking'
      });
    }

    const newActivityDate = new Date(new_activity_date);
    const now = new Date();

    // Check if new date is in the future
    if (newActivityDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'New activity date must be in the future'
      });
    }

    // Check if new date is not too far in the future (e.g., 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (newActivityDate > oneYearFromNow) {
      return res.status(400).json({
        success: false,
        message: 'New activity date cannot be more than 1 year in the future'
      });
    }

    // Check venue availability for new date/time
    const startTime = new_start_time || booking.start_time;
    const endTime = new_end_time || booking.end_time;
    
    const conflictingBookings = await db('bookings')
      .where('venue_id', booking.venue_id)
      .whereNot('id', id)
      .where('status', '!=', 'cancelled')
      .where('activity_date', new_activity_date)
      .whereRaw('start_time < ? AND end_time > ?', [endTime.toString(), startTime.toString()]);

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot conflicts with existing bookings'
      });
    }

    // Update booking
    const updatedBooking = await db('bookings')
      .where('id', id)
      .update({
        activity_date: new_activity_date,
        start_time: new_start_time || booking.start_time,
        end_time: new_end_time || booking.end_time,
        updated_at: new Date()
      })
      .returning('*');

    // Log the rescheduling
    await db('audit_logs').insert({
      user_id: req.user!.id,
      action_type: 'booking_rescheduled',
      table_name: 'bookings',
      record_id: id,
      old_values: JSON.stringify(booking),
      new_values: JSON.stringify(updatedBooking[0]),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      created_at: new Date()
    });

    return res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking'
    });
  }
}));

// Get booking statistics for user
router.get('/stats/overview', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get total bookings
    const totalBookings = await db('bookings')
      .where('user_id', userId)
      .where('is_active', true)
      .count('* as count')
      .first();

    // Get confirmed bookings
    const confirmedBookings = await db('bookings')
      .where('user_id', userId)
      .where('status', 'confirmed')
      .where('is_active', true)
      .count('* as count')
      .first();

    // Get pending bookings
    const pendingBookings = await db('bookings')
      .where('user_id', userId)
      .where('status', 'pending')
      .where('is_active', true)
      .count('* as count')
      .first();

    // Get total spent
    const totalSpent = await db('bookings')
      .where('user_id', userId)
      .where('status', 'confirmed')
      .where('is_active', true)
      .sum('total_amount as total')
      .first();

    // Get upcoming bookings
    const upcomingBookings = await db('bookings')
      .join('activities', 'bookings.activity_id', 'activities.id')
      .where('bookings.user_id', userId)
      .whereIn('bookings.status', ['pending', 'confirmed'])
      .where('bookings.is_active', true)
      .where('activities.start_date', '>=', new Date().toISOString().slice(0, 10))
      .count('* as count')
      .first();

    return res.json({
      success: true,
      data: {
        totalBookings: parseInt(String(totalBookings?.['count'] || '0')),
        confirmedBookings: parseInt(String(confirmedBookings?.['count'] || '0')),
        pendingBookings: parseInt(String(pendingBookings?.['count'] || '0')),
        totalSpent: parseFloat(String(totalSpent?.['total'] || '0')),
        upcomingBookings: parseInt(String(upcomingBookings?.['count'] || '0'))
      }
    });
  } catch (error) {
    logger.error('Error fetching booking statistics:', error);
    throw new AppError('Failed to fetch booking statistics', 500, 'BOOKING_STATS_ERROR');
  }
}));

export default router;

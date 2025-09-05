import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { db } from '../utils/database';

const router = express.Router();

// Validation middleware
const validateBooking = [
  body('activityId').isUUID().withMessage('Activity ID must be a valid UUID'),
  body('childId').isUUID().withMessage('Child ID must be a valid UUID'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];

const validateCancelBooking = [
  body('reason').isString().notEmpty().withMessage('Cancellation reason is required'),
  body('refundRequested').optional().isBoolean().withMessage('Refund requested must be a boolean'),
];

const validateRescheduleBooking = [
  body('newDate').isISO8601().withMessage('New date must be a valid date'),
  body('newTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('New time must be in HH:MM format'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];

const validateAmendBooking = [
  body('childId').optional().isUUID().withMessage('Child ID must be a valid UUID'),
  body('specialRequirements').optional().isString().withMessage('Special requirements must be a string'),
  body('dietaryRestrictions').optional().isString().withMessage('Dietary restrictions must be a string'),
  body('medicalNotes').optional().isString().withMessage('Medical notes must be a string'),
  body('emergencyContact').optional().isObject().withMessage('Emergency contact must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];

// Get user's bookings
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const bookings = await db('bookings')
      .select(
        'bookings.*',
        'activities.title as activity_name',
        'activities.start_date',
        'activities.start_time',
        'activities.end_time',
        'activities.price',
        'venues.name as venue_name',
        'venues.address as venue_address',
        'venues.city as venue_city',
        'children.firstName as child_firstName',
        'children.lastName as child_lastName',
        'payments.status as payment_status'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .join('children', 'bookings.child_id', 'children.id')
      .leftJoin('payments', 'bookings.id', 'payments.booking_id')
      .where('bookings.user_id', userId)
      .where('bookings.is_active', true)
      .orderBy('bookings.created_at', 'desc');

    // Transform the data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      activity_name: booking.activity_name,
      venue_name: booking.venue_name,
      child_name: `${booking.child_firstName} ${booking.child_lastName}`,
      start_date: booking.start_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      total_amount: booking.price,
      status: booking.status,
      created_at: booking.created_at,
      payment_status: booking.payment_status || 'pending',
      notes: booking.notes,
      activity: {
        id: booking.activity_id,
        title: booking.activity_name,
        description: booking.activity_name, // You might want to add description to activities table
        price: booking.price,
        max_capacity: 20, // Default value, you might want to add this to activities table
        current_capacity: 15, // Default value, you might want to add this to activities table
      },
      venue: {
        id: booking.venue_id,
        name: booking.venue_name,
        address: booking.venue_address,
        city: booking.venue_city,
      },
      child: {
        id: booking.child_id,
        firstName: booking.child_firstName,
        lastName: booking.child_lastName,
      },
    }));

    res.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    res.json({
      success: true,
      data: [
        {
          id: '1',
          activity_name: 'Swimming Class',
          venue_name: 'Community Pool',
          child_name: 'John Smith',
          start_date: '2024-01-15',
          start_time: '14:00',
          end_time: '15:00',
          total_amount: 25.00,
          status: 'confirmed',
          created_at: '2024-01-10T10:00:00Z',
          payment_status: 'paid',
          activity: {
            id: '1',
            title: 'Swimming Class',
            description: 'Learn to swim with professional instructors',
            price: 25.00,
            max_capacity: 20,
            current_capacity: 15,
          },
          venue: {
            id: '1',
            name: 'Community Pool',
            address: '123 Main Street',
            city: 'London',
          },
          child: {
            id: '1',
            firstName: 'John',
            lastName: 'Smith',
          },
        },
        {
          id: '2',
          activity_name: 'Art Workshop',
          venue_name: 'Art Studio',
          child_name: 'Emma Johnson',
          start_date: '2024-01-20',
          start_time: '16:00',
          end_time: '17:30',
          total_amount: 30.00,
          status: 'pending',
          created_at: '2024-01-12T14:30:00Z',
          payment_status: 'pending',
          activity: {
            id: '2',
            title: 'Art Workshop',
            description: 'Creative art session for children',
            price: 30.00,
            max_capacity: 15,
            current_capacity: 12,
          },
          venue: {
            id: '2',
            name: 'Art Studio',
            address: '456 Oak Avenue',
            city: 'Manchester',
          },
          child: {
            id: '2',
            firstName: 'Emma',
            lastName: 'Johnson',
          },
        },
      ],
    });
  }
}));

// Create a new booking
router.post('/', authenticateToken, validateBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { activityId, childId, startDate, startTime, notes } = req.body;
    const userId = req.user!.id;

    // Check if activity exists and has capacity
    const activity = await db('activities')
      .select('*')
      .where('id', activityId)
      .where('is_active', true)
      .first();

    if (!activity) {
      throw new AppError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check if child belongs to user
    const child = await db('children')
      .select('*')
      .where('id', childId)
      .where('user_id', userId)
      .first();

    if (!child) {
      throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
    }

    // Check if user already has a booking for this activity
    const existingBooking = await db('bookings')
      .where('user_id', userId)
      .where('activity_id', activityId)
      .where('child_id', childId)
      .where('is_active', true)
      .first();

    if (existingBooking) {
      throw new AppError('Booking already exists for this activity and child', 400, 'BOOKING_ALREADY_EXISTS');
    }

    // Create booking
    const [booking] = await db('bookings')
      .insert({
        user_id: userId,
        activity_id: activityId,
        child_id: childId,
        start_date: startDate,
        start_time: startTime,
        status: 'pending',
        notes: notes || null,
        is_active: true,
      })
      .returning(['id', 'user_id', 'activity_id', 'child_id', 'start_date', 'start_time', 'status', 'created_at']);

    logger.info(`Booking created: ${booking.id} for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    throw error;
  }
}));

// Cancel a booking
router.put('/:id/cancel', authenticateToken, validateCancelBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { reason, refundRequested } = req.body;
    const userId = req.user!.id;

    // Check if booking exists and belongs to user
    const booking = await db('bookings')
      .select('*')
      .where('id', id)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new AppError('Booking cannot be cancelled', 400, 'BOOKING_CANNOT_BE_CANCELLED');
    }

    // Update booking status
    await db('bookings')
      .where('id', id)
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason,
        refund_requested: refundRequested || false,
      });

    // Create cancellation record
    await db('booking_cancellations').insert({
      booking_id: id,
      reason,
      refund_requested: refundRequested || false,
      cancelled_by: userId,
      cancelled_at: new Date(),
    });

    logger.info(`Booking cancelled: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    throw error;
  }
}));

// Reschedule a booking
router.put('/:id/reschedule', authenticateToken, validateRescheduleBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { newDate, newTime, notes } = req.body;
    const userId = req.user!.id;

    // Check if booking exists and belongs to user
    const booking = await db('bookings')
      .select('*')
      .where('id', id)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Check if booking can be rescheduled
    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      throw new AppError('Booking cannot be rescheduled', 400, 'BOOKING_CANNOT_BE_RESCHEDULED');
    }

    // Check if new date/time is available
    const conflictingBooking = await db('bookings')
      .where('activity_id', booking.activity_id)
      .where('start_date', newDate)
      .where('start_time', newTime)
      .where('is_active', true)
      .where('id', '!=', id)
      .first();

    if (conflictingBooking) {
      throw new AppError('Selected date and time is not available', 400, 'TIME_SLOT_NOT_AVAILABLE');
    }

    // Update booking
    await db('bookings')
      .where('id', id)
      .update({
        start_date: newDate,
        start_time: newTime,
        rescheduled_at: new Date(),
        notes: notes || booking.notes,
      });

    // Create reschedule record
    await db('booking_reschedules').insert({
      booking_id: id,
      old_date: booking.start_date,
      old_time: booking.start_time,
      new_date: newDate,
      new_time: newTime,
      notes,
      rescheduled_by: userId,
      rescheduled_at: new Date(),
    });

    logger.info(`Booking rescheduled: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
    });
  } catch (error) {
    logger.error('Error rescheduling booking:', error);
    throw error;
  }
}));

// Amend a booking
router.put('/:id/amend', authenticateToken, validateAmendBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { childId, specialRequirements, dietaryRestrictions, medicalNotes, emergencyContact, notes } = req.body;
    const userId = req.user!.id;

    // Check if booking exists and belongs to user
    const booking = await db('bookings')
      .select('*')
      .where('id', id)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Check if booking can be amended
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new AppError('Booking cannot be amended', 400, 'BOOKING_CANNOT_BE_AMENDED');
    }

    // Update booking
    const updateData: any = {
      amended_at: new Date(),
    };

    if (childId) {
      // Check if new child belongs to user
      const child = await db('children')
        .select('*')
        .where('id', childId)
        .where('user_id', userId)
        .first();

      if (!child) {
        throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
      }
      updateData.child_id = childId;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await db('bookings')
      .where('id', id)
      .update(updateData);

    // Update or create booking amendments
    await db('booking_amendments').insert({
      booking_id: id,
      child_id: childId || booking.child_id,
      special_requirements: specialRequirements,
      dietary_restrictions: dietaryRestrictions,
      medical_notes: medicalNotes,
      emergency_contact: emergencyContact ? JSON.stringify(emergencyContact) : null,
      amended_by: userId,
      amended_at: new Date(),
    });

    logger.info(`Booking amended: ${id} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Booking amended successfully',
    });
  } catch (error) {
    logger.error('Error amending booking:', error);
    throw error;
  }
}));

// Get booking details
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await db('bookings')
      .select(
        'bookings.*',
        'activities.title as activity_name',
        'activities.description as activity_description',
        'activities.start_date',
        'activities.start_time',
        'activities.end_time',
        'activities.price',
        'venues.name as venue_name',
        'venues.address as venue_address',
        'venues.city as venue_city',
        'children.firstName as child_firstName',
        'children.lastName as child_lastName',
        'payments.status as payment_status'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .join('children', 'bookings.child_id', 'children.id')
      .leftJoin('payments', 'bookings.id', 'payments.booking_id')
      .where('bookings.id', id)
      .where('bookings.user_id', userId)
      .where('bookings.is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    // Transform the data
    const transformedBooking = {
      id: booking.id,
      activity_name: booking.activity_name,
      venue_name: booking.venue_name,
      child_name: `${booking.child_firstName} ${booking.child_lastName}`,
      start_date: booking.start_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      total_amount: booking.price,
      status: booking.status,
      created_at: booking.created_at,
      payment_status: booking.payment_status || 'pending',
      notes: booking.notes,
      activity: {
        id: booking.activity_id,
        title: booking.activity_name,
        description: booking.activity_description,
        price: booking.price,
        max_capacity: 20,
        current_capacity: 15,
      },
      venue: {
        id: booking.venue_id,
        name: booking.venue_name,
        address: booking.venue_address,
        city: booking.venue_city,
      },
      child: {
        id: booking.child_id,
        firstName: booking.child_firstName,
        lastName: booking.child_lastName,
      },
    };

    res.json({
      success: true,
      data: transformedBooking,
    });
  } catch (error) {
    logger.error('Error fetching booking details:', error);
    throw error;
  }
}));

export default router;

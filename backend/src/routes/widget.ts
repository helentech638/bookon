import { Router, Request, Response } from 'express';
import { db } from '../utils/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Get widget configuration and data
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { venueId, activityId, theme = 'light', primaryColor = '#00806a' } = req.query;

    if (!venueId && !activityId) {
      throw new AppError('Venue ID or Activity ID is required', 400, 'MISSING_PARAMETERS');
    }

    let widgetData: any = {};

    if (venueId) {
      // Get venue-specific data
      const [venue] = await db('venues')
        .select('*')
        .where('id', venueId)
        .where('is_active', true);

      if (!venue) {
        throw new AppError('Venue not found or inactive', 404, 'VENUE_NOT_FOUND');
      }

      // Get activities for this venue
      const activities = await db('activities')
        .select('*')
        .where('venue_id', venueId)
        .where('is_active', true)
        .orderBy('created_at', 'desc');

      widgetData = {
        venue,
        activities,
        type: 'venue'
      };
    }

    if (activityId) {
      // Get activity-specific data
      const [activity] = await db('activities')
        .select(
          'activities.*',
          'venues.name as venue_name',
          'venues.address as venue_address',
          'venues.city as venue_city'
        )
        .leftJoin('venues', 'activities.venue_id', 'venues.id')
        .where('activities.id', activityId)
        .where('activities.is_active', true);

      if (!activity) {
        throw new AppError('Activity not found or inactive', 404, 'ACTIVITY_NOT_FOUND');
      }

      widgetData = {
        activity,
        type: 'activity'
      };
    }

    // Build widget configuration
    const widgetConfig = {
      theme,
      primaryColor,
      position: 'bottom-right',
      showLogo: true,
      customCSS: '',
      data: widgetData
    };

    // Log widget access
    logger.info('Widget data requested', {
      venueId,
      activityId,
      theme,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    res.json({
      success: true,
      data: widgetConfig
    });
  } catch (error) {
    logger.error('Error fetching widget data:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch widget data', 500, 'WIDGET_FETCH_ERROR');
  }
}));

// Get specific activity data for widget
router.get('/activity/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [activity] = await db('activities')
      .select(
        'activities.*',
        'venues.name as venue_name',
        'venues.address as venue_address',
        'venues.city as venue_city',
        'venues.postcode as venue_postcode'
      )
      .leftJoin('venues', 'activities.venue_id', 'venues.id')
      .where('activities.id', id)
      .where('activities.is_active', true);

    if (!activity) {
      throw new AppError('Activity not found or inactive', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Get current booking count for this activity
    const [bookingCount] = await db('bookings')
      .where('activity_id', id)
      .where('status', '!=', 'cancelled')
      .count('* as count');

    const activityData = {
      id: activity.id,
      title: activity.name,
      description: activity.description,
      startDate: activity.start_date,
      startTime: activity.start_time,
      endTime: activity.end_time,
      price: activity.price,
      currency: 'GBP',
      capacity: activity.max_capacity,
      bookedCount: parseInt(String(bookingCount?.['count'] || '0')),
      venue: {
        id: activity.venue_id,
        name: activity.venue_name,
        address: activity.venue_address,
        city: activity.venue_city,
        postcode: activity.venue_postcode
      }
    };

    res.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    logger.error('Error fetching activity for widget:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch activity data', 500, 'ACTIVITY_FETCH_ERROR');
  }
}));

// Widget analytics tracking endpoint
router.post('/analytics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { eventType, widgetId, venueId, activityId, timestamp, data } = req.body;

    if (!eventType) {
      throw new AppError('Event type is required', 400, 'MISSING_EVENT_TYPE');
    }

    // Store analytics data
    await db('widget_analytics').insert({
      event_type: eventType,
      widget_id: widgetId || 'default',
      venue_id: venueId,
      activity_id: activityId,
      timestamp: timestamp || new Date().toISOString(),
      event_data: JSON.stringify(data || {}),
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      created_at: new Date()
    });

    // Log analytics event
    logger.info('Widget analytics event tracked', {
      eventType,
      widgetId,
      venueId,
      activityId,
      data
    });

    res.json({
      success: true,
      message: 'Analytics event tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking widget analytics:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to track analytics event', 500, 'ANALYTICS_TRACKING_ERROR');
  }
}));

// Get widget analytics summary
router.get('/analytics/summary', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { venueId, activityId, dateFrom, dateTo, eventType } = req.query;

    let query = db('widget_analytics').select('*');

    // Apply filters
    if (venueId) query = query.where('venue_id', venueId);
    if (activityId) query = query.where('activity_id', activityId);
    if (eventType) query = query.where('event_type', eventType);
    if (dateFrom) query = query.where('timestamp', '>=', dateFrom);
    if (dateTo) query = query.where('timestamp', '<=', dateTo);

    const analytics = await query.orderBy('timestamp', 'desc').limit(100);

    // Group by event type for summary
    const eventSummary = analytics.reduce((acc: any, event: any) => {
      const type = event.event_type;
      if (!acc[type]) {
        acc[type] = { count: 0, events: [] };
      }
      acc[type].count++;
      acc[type].events.push(event);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalEvents: analytics.length,
        eventSummary,
        recentEvents: analytics.slice(0, 20)
      }
    });
  } catch (error) {
    logger.error('Error fetching widget analytics summary:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch analytics summary', 500, 'ANALYTICS_FETCH_ERROR');
  }
}));

// Get widget performance metrics
router.get('/performance', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { venueId, days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    let query = db('widget_analytics')
      .where('timestamp', '>=', daysAgo.toISOString());

    if (venueId) {
      query = query.where('venue_id', venueId);
    }

    const analytics = await query.select('*');

    // Calculate metrics
    const totalViews = analytics.filter((e: any) => e.event_type === 'WIDGET_VIEW').length;
    const totalInteractions = analytics.filter((e: any) => e.event_type === 'WIDGET_INTERACTION').length;
    const totalConversions = analytics.filter((e: any) => e.event_type === 'BOOKING_SUCCESS').length;
    const totalErrors = analytics.filter((e: any) => e.event_type === 'BOOKING_ERROR').length;

    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
    const interactionRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

    // Daily breakdown
    const dailyStats = analytics.reduce((acc: any, event: any) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (date && !acc[date]) {
        acc[date] = { views: 0, interactions: 0, conversions: 0, errors: 0 };
      }
      
      if (date) {
        switch (event.event_type) {
          case 'WIDGET_VIEW':
            acc[date].views++;
            break;
          case 'WIDGET_INTERACTION':
            acc[date].interactions++;
            break;
          case 'BOOKING_SUCCESS':
            acc[date].conversions++;
            break;
          case 'BOOKING_ERROR':
            acc[date].errors++;
            break;
        }
      }
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalViews,
        totalInteractions,
        totalConversions,
        totalErrors,
        conversionRate: Math.round(conversionRate * 100) / 100,
        interactionRate: Math.round(interactionRate * 100) / 100,
        dailyStats
      }
    });
  } catch (error) {
    logger.error('Error fetching widget performance:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch performance metrics', 500, 'PERFORMANCE_FETCH_ERROR');
  }
}));

// Handle widget booking submissions
router.post('/book', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      activityId, 
      date, 
      childName, 
      parentEmail, 
      phone, 
      notes,
      source = 'widget',
      widgetId 
    } = req.body;

    // Validate required fields
    if (!activityId || !date || !childName || !parentEmail || !phone) {
      throw new AppError('Missing required fields', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Validate activity exists and is active
    const activity = await db('activities')
      .select('*')
      .where('id', activityId)
      .where('is_active', true)
      .first();

    if (!activity) {
      throw new AppError('Activity not found or inactive', 404, 'ACTIVITY_NOT_FOUND');
    }

    // Check if activity has available capacity
    const currentBookings = await db('bookings')
      .where('activity_id', activityId)
      .where('activity_date', date)
      .where('status', 'confirmed')
      .where('is_active', true)
      .count('* as count')
      .first();

    if (!currentBookings || parseInt(currentBookings['count'] as string) >= activity.max_capacity) {
      throw new AppError('Activity is fully booked for this date', 400, 'ACTIVITY_FULL');
    }

    // Create or find user
    let user = await db('users')
      .select('*')
      .where('email', parentEmail)
      .where('is_active', true)
      .first();

    if (!user) {
      // Create new user
      const [newUser] = await db('users')
        .insert({
          email: parentEmail,
          password_hash: 'temp_hash_' + Math.random().toString(36).substr(2, 9), // Temporary hash
          role: 'parent',
          is_active: true,
          email_verified: false,
        })
        .returning(['id', 'email', 'role']);

      user = newUser;

      // Create user profile
      await db('user_profiles')
        .insert({
          user_id: user.id,
          first_name: childName.split(' ')[0] || 'Parent',
          last_name: childName.split(' ').slice(1).join(' ') || 'User',
          phone: phone,
        });

      logger.info('New user created from widget', { userId: user.id, email: parentEmail });
    }

    // Create child record
    const [child] = await db('children')
      .insert({
        user_id: user.id,
        first_name: childName.split(' ')[0] || 'Child',
        last_name: childName.split(' ').slice(1).join(' ') || 'User',
        date_of_birth: new Date(), // Default date, can be updated later
        is_active: true,
      })
      .returning(['id', 'first_name', 'last_name']);

    // Create booking
    const [booking] = await db('bookings')
      .insert({
        user_id: user.id,
        activity_id: activityId,
        venue_id: activity.venue_id,
        child_id: child.id,
        status: 'pending',
        payment_status: 'pending',
        amount: activity.price,
        currency: 'GBP',
        booking_date: new Date(),
        activity_date: date,
        activity_time: activity.start_time || '09:00',
        notes: notes || `Widget booking from ${source}`,
        is_active: true,
      })
      .returning(['id', 'status', 'amount']);

    // Log widget analytics
    if (widgetId) {
      try {
        await db('widget_analytics')
          .insert({
            event_type: 'BOOKING_CREATED',
            widget_id: widgetId,
            venue_id: activity.venue_id,
            activity_id: activityId,
            event_data: {
              source,
              childName,
              parentEmail,
              date,
              amount: activity.price
            },
            user_agent: req.get('User-Agent'),
            ip_address: req.ip,
          });
      } catch (analyticsError) {
        logger.warn('Failed to log widget analytics', { error: analyticsError, widgetId });
      }
    }

    logger.info('Widget booking created successfully', {
      bookingId: booking.id,
      activityId,
      userId: user.id,
      childId: child.id,
      source,
      widgetId
    });

    res.json({
      success: true,
      message: 'Booking submitted successfully',
      data: {
        bookingId: booking.id,
        status: booking.status,
        nextSteps: [
          'We will review your booking and confirm availability',
          'You will receive a confirmation email shortly',
          'Payment will be processed upon confirmation'
        ]
      }
    });

  } catch (error) {
    logger.error('Error processing widget booking:', error);
    
    // Log widget analytics for failed booking
    if (req.body.widgetId) {
      try {
        await db('widget_analytics')
          .insert({
            event_type: 'BOOKING_FAILED',
            widget_id: req.body.widgetId,
            venue_id: req.body.venueId,
            activity_id: req.body.activityId,
            event_data: {
              error: error instanceof Error ? error.message : 'Unknown error',
              source: req.body.source || 'widget'
            },
            user_agent: req.get('User-Agent'),
            ip_address: req.ip,
          });
      } catch (analyticsError) {
        logger.warn('Failed to log widget analytics', { error: analyticsError });
      }
    }

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to process booking', 500, 'WIDGET_BOOKING_ERROR');
  }
}));

export default router;

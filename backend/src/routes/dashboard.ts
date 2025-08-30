import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/database';
import { logger } from '../utils/logger';

const router = Router();

// Get dashboard statistics - using only existing columns
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Get user's registration date for "member since" calculation
    const user = await db('users')
      .select('created_at')
      .where('id', userId)
      .first();

    const memberSince = user?.created_at ? new Date(user.created_at) : new Date();
    const daysSince = Math.floor((new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get real booking statistics using only existing columns
    const totalBookings = await db('bookings')
      .where('user_id', userId)
      .count('* as count')
      .first();

    const confirmedBookings = await db('bookings')
      .where('user_id', userId)
      .where('status', 'confirmed')
      .count('* as count')
      .first();

    const totalSpent = await db('bookings')
      .where('user_id', userId)
      .where('status', 'confirmed')
      .sum('amount as total')
      .first();

    const upcomingActivities = await db('bookings')
      .join('activities', 'bookings.activity_id', 'activities.id')
      .where('bookings.user_id', userId)
      .whereIn('bookings.status', ['pending', 'confirmed'])
      .count('* as count')
      .first();

    res.json({
      success: true,
      data: {
        totalBookings: parseInt(String(totalBookings?.['count'] || '0')),
        confirmedBookings: parseInt(String(confirmedBookings?.['count'] || '0')),
        totalSpent: parseFloat(String(totalSpent?.['total'] || '0.00')),
        upcomingActivities: parseInt(String(upcomingActivities?.['count'] || '0')),
        memberSince: daysSince,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    throw new AppError('Failed to fetch dashboard statistics', 500, 'DASHBOARD_STATS_ERROR');
  }
}));

// Get user profile data for dashboard
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    const user = await db('users')
      .select('id', 'email', 'role', 'created_at')
      .where('id', userId)
      .first();

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          memberSince: user.created_at
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw new AppError('Failed to fetch user profile', 500, 'PROFILE_FETCH_ERROR');
  }
}));

// Get user's activities
router.get('/activities', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    const activities = await db('bookings')
      .select(
        'bookings.id',
        'bookings.status',
        'bookings.created_at',
        'activities.name',
        'activities.description',
        'venues.name as venue_name'
      )
      .leftJoin('activities', 'bookings.activity_id', 'activities.id')
      .leftJoin('venues', 'activities.venue_id', 'venues.id')
      .where('bookings.user_id', userId)
      .orderBy('bookings.created_at', 'desc');

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Error fetching user activities:', error);
    throw new AppError('Failed to fetch user activities', 500, 'ACTIVITIES_FETCH_ERROR');
  }
}));

// Get user's children
router.get('/children', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    const children = await db('children')
      .select('id', 'first_name', 'last_name', 'date_of_birth', 'gender')
      .where('user_id', userId)
      .orderBy('first_name', 'asc');

    res.json({
      success: true,
      data: children.map(child => ({
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        dateOfBirth: child.date_of_birth,
        gender: child.gender
      }))
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
    // Get recent bookings
    const recentBookings = await db('bookings')
      .select(
        'bookings.id',
        'bookings.status',
        'bookings.created_at',
        'activities.name as activity_title',
        'venues.name as venue_name'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('bookings.user_id', userId)
      .orderBy('bookings.created_at', 'desc')
      .limit(3);

    // Get recent payments from bookings (since payments table might not exist)
    const recentPayments = await db('bookings')
      .select(
        'bookings.id',
        'bookings.payment_status as status',
        'bookings.amount',
        'bookings.created_at',
        'activities.name as activity_title'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .where('bookings.user_id', userId)
      .orderBy('bookings.created_at', 'desc')
      .limit(3);

    // Combine and sort by date
    const allActivities = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        id: booking.id,
        title: `Booked: ${booking.activity_title}`,
        subtitle: `at ${booking.venue_name}`,
        status: booking.status,
        date: booking.created_at
      })),
      ...recentPayments.map(payment => ({
        type: 'payment',
        id: payment.id,
        title: `Payment: ${payment.activity_title}`,
        subtitle: `£${parseFloat(payment.amount).toFixed(2)}`,
        status: payment.status,
        date: payment.created_at
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

    res.json({
      success: true,
      data: allActivities
    });
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    throw new AppError('Failed to fetch recent activity', 500, 'RECENT_ACTIVITY_FETCH_ERROR');
  }
}));

// Get recent activities for user
router.get('/recent-activities', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get user's recent activities from bookings
    const recentActivities = await db('bookings')
      .select(
        'bookings.id',
        'bookings.created_at',
        'bookings.status',
        'activities.name as activity_name',
        'activities.description as activity_description',
        'venues.name as venue_name'
      )
      .leftJoin('activities', 'bookings.activity_id', 'activities.id')
      .leftJoin('venues', 'activities.venue_id', 'venues.id')
      .where('bookings.user_id', userId)
      .orderBy('bookings.created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      data: recentActivities.map(activity => ({
        id: activity.id,
        type: 'booking',
        title: activity.activity_name,
        description: activity.activity_description,
        venue: activity.venue_name,
        status: activity.status,
        timestamp: activity.created_at
      }))
    });
  } catch (error) {
    logger.error('Error fetching recent activities:', error);
    throw new AppError('Failed to fetch recent activities', 500, 'RECENT_ACTIVITIES_ERROR');
  }
}));

export default router;

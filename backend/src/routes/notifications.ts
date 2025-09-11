import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get notifications
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = '10', unread = 'false' } = req.query;
    const userId = req.user!.id;
    
    logger.info('Notifications requested', { 
      user: req.user?.email,
      limit,
      unread,
      userId 
    });

    const notifications = await safePrismaQuery(async (client) => {
      return await client.notification.findMany({
        where: {
          userId: userId,
          ...(unread === 'true' ? { read: false } : {})
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit as string)
      });
    });

    // Transform the data to match the frontend interface
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type as 'booking' | 'cancellation' | 'waitlist' | 'refund',
      title: notification.title,
      created_at: notification.createdAt.toISOString(),
      action_url: notification.data ? (notification.data as any).action_url : null,
      read: notification.read
    }));

    logger.info('Notifications retrieved', { 
      count: transformedNotifications.length 
    });

    res.json({
      success: true,
      data: transformedNotifications
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    throw new AppError('Failed to fetch notifications', 500, 'NOTIFICATIONS_FETCH_ERROR');
  }
}));

// Mark notifications as read
router.post('/mark-read', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user!.id;
    
    logger.info('Mark notifications as read requested', { 
      user: req.user?.email,
      notificationIds,
      userId 
    });

    await safePrismaQuery(async (client) => {
      await client.notification.updateMany({
        where: {
          id: {
            in: notificationIds
          },
          userId: userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    });

    logger.info('Notifications marked as read', { 
      count: notificationIds.length 
    });

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking notifications as read:', error);
    throw new AppError('Failed to mark notifications as read', 500, 'MARK_READ_FAILED');
  }
}));

export default router;
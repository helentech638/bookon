import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import NotificationService from '../services/notificationService';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 20, offset = 0, unread_only } = req.query;
    
    let notifications = await NotificationService.getUserNotifications(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    // Filter unread only if requested
    if (unread_only === 'true') {
      notifications = notifications.filter((n: any) => !n.read);
    }
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: notifications.length,
        }
      }
    });
    
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    throw error;
  }
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }
    
    await NotificationService.markAsRead(id);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
}));

// Mark all notifications as read
router.patch('/read-all', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
}));

// Get notification statistics (admin only)
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { venue_id } = req.query;
    
    // Check if user is admin or venue staff
    if (user.role !== 'admin' && user.role !== 'staff') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    const venueId = (venue_id as string) || (user.role === 'staff' ? (user.venueId as string) : undefined);
    const stats = await NotificationService.getNotificationStats(venueId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Error fetching notification statistics:', error);
    throw error;
  }
}));

// Create notification (admin/staff only)
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { userId, venueId, type, title, message, data, priority, channels } = req.body;
    
    // Check if user is admin or staff
    if (user.role !== 'admin' && user.role !== 'staff') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    // Staff can only send to their venue
    const targetVenueId = user.role === 'staff' ? user.venueId : venueId;
    
    const notification = await NotificationService.createNotification({
      userId,
      venueId: targetVenueId,
      type,
      title,
      message,
      data,
      priority,
      channels,
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
    
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
}));

// Get notification by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: notification
    });
    
  } catch (error) {
    logger.error('Error fetching notification:', error);
    throw error;
  }
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
    }
    
    await prisma.notification.delete({
      where: { id: id },
    });
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting notification:', error);
    throw error;
  }
}));

// Notification health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Notification system is healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /notifications',
      'PATCH /notifications/:id/read',
      'PATCH /notifications/read-all',
      'GET /notifications/stats',
      'POST /notifications',
      'GET /notifications/:id',
      'DELETE /notifications/:id',
      'GET /notifications/health'
    ]
  });
});

export default router;
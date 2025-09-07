import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { dataRetentionService } from '../services/dataRetentionService';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Get data retention statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await dataRetentionService.getRetentionStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting retention stats:', error);
    throw error;
  }
}));

// Clean up expired data (admin only)
router.post('/cleanup', authenticateToken, requireAdmin, [
  body('policy').optional().isObject().withMessage('Policy must be an object'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { policy } = req.body;
    const result = await dataRetentionService.cleanupExpiredData(policy);

    res.json({
      success: true,
      message: 'Data cleanup completed',
      data: result
    });
  } catch (error) {
    logger.error('Error cleaning up data:', error);
    throw error;
  }
}));

// Export user data for GDPR compliance
router.get('/export/:userId', authenticateToken, [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const requestingUserId = req.user!.id;

    // Users can only export their own data, admins can export any user's data
    if (req.user!.role !== 'admin' && requestingUserId !== userId) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    const userData = await dataRetentionService.exportUserData(userId);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Error exporting user data:', error);
    throw error;
  }
}));

// Anonymize user data (admin only)
router.post('/anonymize/:userId', authenticateToken, requireAdmin, [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const adminId = req.user!.id;

    await dataRetentionService.anonymizeUserData(userId);

    logger.info('User data anonymized', { userId, adminId });

    res.json({
      success: true,
      message: 'User data anonymized successfully'
    });
  } catch (error) {
    logger.error('Error anonymizing user data:', error);
    throw error;
  }
}));

// Delete user data completely (admin only)
router.delete('/delete/:userId', authenticateToken, requireAdmin, [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
  body('confirm').equals('DELETE').withMessage('Confirmation required'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { userId } = req.params;
    const adminId = req.user!.id;

    await dataRetentionService.deleteUserData(userId);

    logger.info('User data deleted completely', { userId, adminId });

    res.json({
      success: true,
      message: 'User data deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user data:', error);
    throw error;
  }
}));

// Get data retention policy
router.get('/policy', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const policy = {
      userData: 2555, // 7 years (GDPR requirement)
      bookingData: 2555, // 7 years (financial records)
      auditLogs: 2555, // 7 years (compliance)
      webhookEvents: 365, // 1 year
      notificationData: 90, // 3 months
      expiredCredits: 365 // 1 year
    };

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    logger.error('Error getting retention policy:', error);
    throw error;
  }
}));

// Update data retention policy (admin only)
router.put('/policy', authenticateToken, requireAdmin, [
  body('userData').optional().isInt({ min: 30 }).withMessage('User data retention must be at least 30 days'),
  body('bookingData').optional().isInt({ min: 30 }).withMessage('Booking data retention must be at least 30 days'),
  body('auditLogs').optional().isInt({ min: 30 }).withMessage('Audit logs retention must be at least 30 days'),
  body('webhookEvents').optional().isInt({ min: 7 }).withMessage('Webhook events retention must be at least 7 days'),
  body('notificationData').optional().isInt({ min: 7 }).withMessage('Notification data retention must be at least 7 days'),
  body('expiredCredits').optional().isInt({ min: 7 }).withMessage('Expired credits retention must be at least 7 days'),
], asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const policy = req.body;
    const adminId = req.user!.id;

    // TODO: Store policy in database or configuration
    logger.info('Data retention policy updated', { policy, adminId });

    res.json({
      success: true,
      message: 'Data retention policy updated successfully',
      data: policy
    });
  } catch (error) {
    logger.error('Error updating retention policy:', error);
    throw error;
  }
}));

export default router;

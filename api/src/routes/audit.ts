import { Router, Request, Response } from 'express';
import { query, param } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { auditService } from '../services/auditService';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

// Validation middleware
const validateDateRange = [
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required')
];

const validateEntityId = [
  param('entityType').isString().withMessage('Valid entity type is required'),
  param('entityId').isString().withMessage('Valid entity ID is required')
];

// Get audit report (admin only)
router.get('/report', authenticateToken, validateDateRange, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, entityType, userId } = req.query;
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    const report = await auditService.getAuditReport(
      start,
      end,
      entityType as string,
      userId as string
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error getting audit report:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get audit report', 500, 'AUDIT_REPORT_ERROR');
  }
}));

// Get financial report (admin only)
router.get('/financial', authenticateToken, validateDateRange, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, venueId } = req.query;
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    const report = await auditService.getFinancialReport(
      start,
      end,
      venueId as string
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error getting financial report:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get financial report', 500, 'FINANCIAL_REPORT_ERROR');
  }
}));

// Get user activity report (admin only)
router.get('/user-activity', authenticateToken, validateDateRange, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, userId } = req.query;
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    const report = await auditService.getUserActivityReport(
      start,
      end,
      userId as string
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error getting user activity report:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get user activity report', 500, 'USER_ACTIVITY_REPORT_ERROR');
  }
}));

// Get entity audit history
router.get('/entity/:entityType/:entityId', authenticateToken, validateEntityId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check if user has access to this entity
    if (userRole !== 'admin') {
      // For non-admin users, check if they own the entity
      if (entityType === 'booking') {
        const booking = await prisma.booking.findFirst({
          where: {
            id: entityId,
            parentId: userId
          }
        });
        if (!booking) {
          throw new AppError('Access denied', 403, 'ACCESS_DENIED');
        }
      } else if (entityType === 'user' && entityId !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }
    }

    const history = await auditService.getEntityAuditHistory(
      entityType,
      entityId,
      Number(limit)
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting entity audit history:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get entity audit history', 500, 'ENTITY_AUDIT_HISTORY_ERROR');
  }
}));

// Export audit data (admin only)
router.get('/export', authenticateToken, validateDateRange, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { startDate, endDate, entityType, userId } = req.query;
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    const csvData = await auditService.exportAuditData(
      start,
      end,
      entityType as string,
      userId as string
    );

    const filename = `audit-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

    logger.info('Audit data exported', {
      adminId: user.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      entityType,
      userId
    });
  } catch (error) {
    logger.error('Error exporting audit data:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to export audit data', 500, 'AUDIT_EXPORT_ERROR');
  }
}));

// Get audit statistics (admin only)
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const { period = '30d' } = req.query;
    
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const report = await auditService.getAuditReport(startDate, endDate);
    const financialReport = await auditService.getFinancialReport(startDate, endDate);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        audit: report,
        financial: financialReport
      }
    });
  } catch (error) {
    logger.error('Error getting audit stats:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get audit stats', 500, 'AUDIT_STATS_ERROR');
  }
}));

export default router;

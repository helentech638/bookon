import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get dashboard snapshot data
router.get('/snapshot', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { range = 'today' } = req.query;
    const userId = req.user!.id;
    
    logger.info('Dashboard snapshot requested', { 
      user: req.user?.email,
      range,
      userId 
    });

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    const snapshotData = await safePrismaQuery(async (client) => {
      // Get activities running today
      const activitiesRunning = await client.activity.count({
        where: {
          startDate: {
            lte: endDate,
            gte: startDate
          },
          isActive: true
        }
      });

      // Get total attendees today
      const attendeesToday = await client.booking.aggregate({
        where: {
          activityDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'confirmed'
        },
        _count: {
          childId: true
        }
      });

      // Get total parents registered
      const parentsRegistered = await client.user.count({
        where: {
          role: 'parent',
          isActive: true
        }
      });

      // Get payments collected
      const paymentsTotal = await client.booking.aggregate({
        where: {
          bookingDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'confirmed',
          paymentStatus: 'paid'
        },
        _sum: {
          amount: true
        }
      });

      // Get refunds total
      const refundsTotal = await client.booking.aggregate({
        where: {
          bookingDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'cancelled'
        },
        _sum: {
          amount: true
        }
      });

      // Get credits total (mock for now)
      const creditsTotal = 0; // TODO: Implement credits system

      return {
        activities_running: activitiesRunning,
        attendees_today: attendeesToday._count.childId || 0,
        parents_registered: parentsRegistered,
        payments_total: parseFloat(String(paymentsTotal._sum?.amount || '0.00')),
        refunds_total: parseFloat(String(refundsTotal._sum?.amount || '0.00')),
        credits_total: creditsTotal
      };
    });

    logger.info('Dashboard snapshot data retrieved', { 
      activitiesRunning: snapshotData.activities_running,
      attendeesToday: snapshotData.attendees_today,
      parentsRegistered: snapshotData.parents_registered
    });

    res.json({
      success: true,
      data: snapshotData
    });
  } catch (error) {
    logger.error('Error fetching dashboard snapshot:', error);
    throw new AppError('Failed to fetch dashboard snapshot', 500, 'DASHBOARD_SNAPSHOT_ERROR');
  }
}));

export default router;

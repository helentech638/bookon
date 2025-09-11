import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get finance summary
router.get('/summary', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { range = 'today' } = req.query;
    const userId = req.user!.id;
    
    logger.info('Finance summary requested', { 
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

    const financeData = await safePrismaQuery(async (client) => {
      // Get income (confirmed bookings with paid status)
      const incomeResult = await client.booking.aggregate({
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

      // Get refunds (cancelled bookings)
      const refundsResult = await client.booking.aggregate({
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

      // Get credits (mock for now - TODO: Implement credits system)
      const credits = 0;

      // Generate timeseries data for charts (last 7 days)
      const timeseries = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayIncome = await client.booking.aggregate({
          where: {
            bookingDate: {
              gte: dayStart,
              lt: dayEnd
            },
            status: 'confirmed',
            paymentStatus: 'paid'
          },
          _sum: {
            amount: true
          }
        });

        timeseries.push({
          date: dayStart.toISOString().split('T')[0],
          value: parseFloat(String(dayIncome._sum?.amount || '0.00'))
        });
      }

      return {
        income: parseFloat(String(incomeResult._sum?.amount || '0.00')),
        refunds: parseFloat(String(refundsResult._sum?.amount || '0.00')),
        credits: credits,
        timeseries: timeseries
      };
    });

    logger.info('Finance summary data retrieved', { 
      income: financeData.income,
      refunds: financeData.refunds,
      credits: financeData.credits
    });

    res.json({
      success: true,
      data: financeData
    });
  } catch (error) {
    logger.error('Error fetching finance summary:', error);
    throw new AppError('Failed to fetch finance summary', 500, 'FINANCE_SUMMARY_ERROR');
  }
}));

export default router;

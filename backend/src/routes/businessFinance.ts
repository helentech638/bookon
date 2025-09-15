import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business finance transactions
router.get('/transactions', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, paymentMethod, status, page = 1, limit = 20, startDate, endDate } = req.query;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Build where clause for payments
    const where: any = {
      booking: {
        activity: {
          venueId: { in: venueIds }
        }
      }
    };

    if (search) {
      where.OR = [
        {
          booking: {
            parent: {
              firstName: { contains: search as string, mode: 'insensitive' }
            }
          }
        },
        {
          booking: {
            parent: {
              lastName: { contains: search as string, mode: 'insensitive' }
            }
          }
        },
        {
          booking: {
            activity: {
              title: { contains: search as string, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (paymentMethod) {
      if (paymentMethod === 'card') {
        where.paymentMethod = 'card';
      } else if (paymentMethod === 'tax_free_childcare') {
        where.paymentMethod = 'tax_free_childcare';
      } else if (paymentMethod === 'credit') {
        where.paymentMethod = 'credit';
      }
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Get transactions with pagination
    const transactions = await safePrismaQuery(async (client) => {
      return await client.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              parent: {
                select: { firstName: true, lastName: true, email: true }
              },
              child: {
                select: { firstName: true, lastName: true }
              },
              activity: {
                select: { title: true, venue: { select: { name: true } } }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });
    });

    // Get total count for pagination
    const totalCount = await safePrismaQuery(async (client) => {
      return await client.payment.count({ where });
    });

    // Get summary statistics
    const stats = await safePrismaQuery(async (client) => {
      const totalRevenue = await client.payment.aggregate({
        where: {
          ...where,
          status: 'succeeded'
        },
        _sum: { amount: true }
      });

      const cardPayments = await client.payment.aggregate({
        where: {
          ...where,
          status: 'succeeded',
          paymentMethod: 'card'
        },
        _sum: { amount: true }
      });

      const tfcPayments = await client.payment.aggregate({
        where: {
          ...where,
          status: 'succeeded',
          paymentMethod: 'tax_free_childcare'
        },
        _sum: { amount: true }
      });

      const creditPayments = await client.payment.aggregate({
        where: {
          ...where,
          status: 'succeeded',
          paymentMethod: 'credit'
        },
        _sum: { amount: true }
      });

      return {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        cardPayments: Number(cardPayments._sum.amount || 0),
        tfcPayments: Number(tfcPayments._sum.amount || 0),
        creditPayments: Number(creditPayments._sum.amount || 0)
      };
    });

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      parentName: `${transaction.booking.parent.firstName} ${transaction.booking.parent.lastName}`,
      childName: `${transaction.booking.child.firstName} ${transaction.booking.child.lastName}`,
      activity: transaction.booking.activity.title,
      venue: transaction.booking.activity.venue.name,
      amount: Number(transaction.amount),
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      date: transaction.createdAt.toISOString().split('T')[0],
      time: transaction.createdAt.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      createdAt: transaction.createdAt
    }));

    logger.info('Business transactions fetched successfully', { 
      userId, 
      count: formattedTransactions.length,
      totalCount 
    });

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        stats: stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business transactions:', error);
    throw new AppError('Failed to fetch transactions', 500, 'TRANSACTIONS_ERROR');
  }
}));

// Get business finance summary
router.get('/summary', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { range = 'today' } = req.query;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    const where = {
      booking: {
        activity: {
          venueId: { in: venueIds }
        }
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Get financial summary
    const summary = await safePrismaQuery(async (client) => {
      const totalRevenue = await client.payment.aggregate({
        where: {
          ...where,
          status: 'succeeded'
        },
        _sum: { amount: true }
      });

      const totalRefunds = await client.refund.aggregate({
        where: {
          booking: {
            activity: {
              venueId: { in: venueIds }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true }
      });

      const totalCredits = await client.walletCredit.aggregate({
        where: {
          parent: {
            bookings: {
              some: {
                activity: {
                  venueId: { in: venueIds }
                }
              }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { amount: true }
      });

      const transactionCount = await client.payment.count({
        where: {
          ...where,
          status: 'succeeded'
        }
      });

      return {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        totalRefunds: Number(totalRefunds._sum.amount || 0),
        totalCredits: Number(totalCredits._sum.amount || 0),
        transactionCount: transactionCount,
        netRevenue: Number(totalRevenue._sum.amount || 0) - Number(totalRefunds._sum.amount || 0)
      };
    });

    logger.info('Business finance summary fetched successfully', { userId, range });

    res.json({
      success: true,
      data: {
        summary: summary,
        range: range,
        startDate: startDate,
        endDate: endDate
      }
    });

  } catch (error) {
    logger.error('Error fetching business finance summary:', error);
    throw new AppError('Failed to fetch finance summary', 500, 'FINANCE_SUMMARY_ERROR');
  }
}));

// Get business discounts
router.get('/discounts', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Get discounts
    const discounts = await safePrismaQuery(async (client) => {
      return await client.discount.findMany({
        where: {
          OR: [
            { venueId: { in: venueIds } },
            { createdBy: userId }
          ]
        },
        include: {
          venue: {
            select: { name: true }
          },
          _count: {
            select: {
              usages: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    logger.info('Business discounts fetched successfully', { userId, count: discounts.length });

    res.json({
      success: true,
      data: {
        discounts: discounts.map(discount => ({
          id: discount.id,
          name: discount.name,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          minAmount: discount.minAmount,
          maxUses: discount.maxUses,
          usedCount: discount._count.usages,
          isActive: discount.isActive,
          expiresAt: discount.expiresAt,
          venue: discount.venue?.name,
          createdAt: discount.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching business discounts:', error);
    throw new AppError('Failed to fetch discounts', 500, 'DISCOUNTS_ERROR');
  }
}));

// Get business credits
router.get('/credits', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Check if user has business access
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: { role: true, businessName: true, isActive: true }
      });
    });

    if (!userInfo || (!userInfo.businessName && userInfo.role !== 'business' && userInfo.role !== 'admin')) {
      throw new AppError('Business access required', 403, 'BUSINESS_ACCESS_REQUIRED');
    }

    // Get user's venues
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });
    });

    const venueIds = venues.map(v => v.id);

    // Get credits
    const credits = await safePrismaQuery(async (client) => {
      return await client.walletCredit.findMany({
        where: {
          parent: {
            bookings: {
              some: {
                activity: {
                  venueId: { in: venueIds }
                }
              }
            }
          }
        },
        include: {
          parent: {
            select: { firstName: true, lastName: true, email: true }
          },
          booking: {
            include: {
              activity: {
                select: { title: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    logger.info('Business credits fetched successfully', { userId, count: credits.length });

    res.json({
      success: true,
      data: {
        credits: credits.map(credit => ({
          id: credit.id,
          parentName: `${credit.parent.firstName} ${credit.parent.lastName}`,
          parentEmail: credit.parent.email,
          amount: Number(credit.amount),
          balance: Number(credit.balance),
          reason: credit.reason,
          activity: credit.booking?.activity?.title,
          expiresAt: credit.expiresAt,
          createdAt: credit.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching business credits:', error);
    throw new AppError('Failed to fetch credits', 500, 'CREDITS_ERROR');
  }
}));

export default router;

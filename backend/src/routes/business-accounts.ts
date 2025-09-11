import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get all business accounts
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    logger.info('Business accounts requested', { 
      user: req.user?.email,
      userId 
    });

    const businessAccounts = await safePrismaQuery(async (client) => {
      return await client.businessAccount.findMany({
        include: {
          venues: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true
            }
          },
          _count: {
            select: {
              venues: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    logger.info('Business accounts retrieved', { 
      count: businessAccounts.length 
    });

    res.json({
      success: true,
      data: businessAccounts
    });
  } catch (error) {
    logger.error('Error fetching business accounts:', error);
    throw error;
  }
}));

// Get single business account
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    logger.info('Business account requested', { 
      user: req.user?.email,
      businessAccountId: id,
      userId 
    });

    const businessAccount = await safePrismaQuery(async (client) => {
      return await client.businessAccount.findFirst({
        where: { id: id },
        include: {
          venues: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              inheritFranchiseFee: true,
              franchiseFeeType: true,
              franchiseFeeValue: true
            }
          }
        }
      });
    });

    if (!businessAccount) {
      throw new AppError('Business account not found', 404, 'BUSINESS_ACCOUNT_NOT_FOUND');
    }

    logger.info('Business account retrieved', { 
      businessAccountId: id 
    });

    res.json({
      success: true,
      data: businessAccount
    });
  } catch (error) {
    logger.error('Error fetching business account:', error);
    throw error;
  }
}));

// Create business account
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      stripeAccountId,
      stripeAccountType = 'express',
      franchiseFeeType = 'percent',
      franchiseFeeValue,
      vatMode = 'inclusive',
      adminFeeAmount
    } = req.body;
    
    logger.info('Creating business account', { 
      user: req.user?.email,
      name,
      stripeAccountId,
      userId 
    });

    const businessAccount = await safePrismaQuery(async (client) => {
      return await client.businessAccount.create({
        data: {
          name,
          stripeAccountId,
          stripeAccountType,
          franchiseFeeType,
          franchiseFeeValue: parseFloat(franchiseFeeValue),
          vatMode,
          adminFeeAmount: adminFeeAmount ? parseFloat(adminFeeAmount) : null
        }
      });
    });

    logger.info('Business account created', { 
      businessAccountId: businessAccount.id 
    });

    res.status(201).json({
      success: true,
      data: businessAccount
    });
  } catch (error) {
    logger.error('Error creating business account:', error);
    throw error;
  }
}));

// Update business account
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;
    
    logger.info('Updating business account', { 
      user: req.user?.email,
      businessAccountId: id,
      userId 
    });

    const businessAccount = await safePrismaQuery(async (client) => {
      return await client.businessAccount.update({
        where: { id: id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
    });

    logger.info('Business account updated', { 
      businessAccountId: id 
    });

    res.json({
      success: true,
      data: businessAccount
    });
  } catch (error) {
    logger.error('Error updating business account:', error);
    throw error;
  }
}));

// Update Stripe account status
router.patch('/:id/stripe-status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status } = req.body;
    
    logger.info('Updating Stripe account status', { 
      user: req.user?.email,
      businessAccountId: id,
      status,
      userId 
    });

    const businessAccount = await safePrismaQuery(async (client) => {
      return await client.businessAccount.update({
        where: { id: id },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    });

    logger.info('Stripe account status updated', { 
      businessAccountId: id,
      status 
    });

    res.json({
      success: true,
      data: businessAccount
    });
  } catch (error) {
    logger.error('Error updating Stripe account status:', error);
    throw error;
  }
}));

// Get franchise fee configuration
router.get('/:id/franchise-config', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    logger.info('Franchise fee configuration requested', { 
      user: req.user?.email,
      businessAccountId: id,
      userId 
    });

    const businessAccount = await safePrismaQuery(async (client) => {
      return await client.businessAccount.findFirst({
        where: { id: id },
        select: {
          id: true,
          name: true,
          franchiseFeeType: true,
          franchiseFeeValue: true,
          vatMode: true,
          adminFeeAmount: true,
          venues: {
            select: {
              id: true,
              name: true,
              inheritFranchiseFee: true,
              franchiseFeeType: true,
              franchiseFeeValue: true
            }
          }
        }
      });
    });

    if (!businessAccount) {
      throw new AppError('Business account not found', 404, 'BUSINESS_ACCOUNT_NOT_FOUND');
    }

    logger.info('Franchise fee configuration retrieved', { 
      businessAccountId: id 
    });

    res.json({
      success: true,
      data: businessAccount
    });
  } catch (error) {
    logger.error('Error fetching franchise fee configuration:', error);
    throw error;
  }
}));

// Calculate franchise fee for a transaction
router.post('/:id/calculate-fee', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { amount, venueId } = req.body;
    
    logger.info('Calculating franchise fee', { 
      user: req.user?.email,
      businessAccountId: id,
      amount,
      venueId,
      userId 
    });

    const result = await safePrismaQuery(async (client) => {
      const businessAccount = await client.businessAccount.findFirst({
        where: { id: id }
      });

      if (!businessAccount) {
        throw new AppError('Business account not found', 404, 'BUSINESS_ACCOUNT_NOT_FOUND');
      }

      let franchiseFee = 0;
      let franchiseFeeType = businessAccount.franchiseFeeType;
      let franchiseFeeValue = businessAccount.franchiseFeeValue;

      // Check if venue has custom franchise fee
      if (venueId) {
        const venue = await client.venue.findFirst({
          where: { 
            id: venueId,
            businessAccountId: id
          }
        });

        if (venue && !venue.inheritFranchiseFee) {
          franchiseFeeType = venue.franchiseFeeType || businessAccount.franchiseFeeType;
          franchiseFeeValue = venue.franchiseFeeValue || businessAccount.franchiseFeeValue;
        }
      }

      // Calculate franchise fee
      if (franchiseFeeType === 'percent') {
        franchiseFee = (parseFloat(amount) * parseFloat(franchiseFeeValue.toString())) / 100;
      } else {
        franchiseFee = parseFloat(franchiseFeeValue.toString());
      }

      // Add admin fee if applicable
      const adminFee = businessAccount.adminFeeAmount || 0;
      const totalFee = franchiseFee + parseFloat(adminFee.toString());
      const netToVenue = parseFloat(amount) - totalFee;

      return {
        grossAmount: parseFloat(amount),
        franchiseFee: franchiseFee,
        adminFee: parseFloat(adminFee.toString()),
        totalFee: totalFee,
        netToVenue: netToVenue,
        franchiseFeeType,
        franchiseFeeValue,
        businessAccountName: businessAccount.name
      };
    });

    logger.info('Franchise fee calculated', { 
      businessAccountId: id,
      franchiseFee: result.franchiseFee,
      netToVenue: result.netToVenue 
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error calculating franchise fee:', error);
    throw error;
  }
}));

export default router;

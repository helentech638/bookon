import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business settings
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
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

    // Get user's business information
    const user = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          businessName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    // Get user's venues for business info
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postcode: true,
          phone: true,
          email: true,
          capacity: true,
          isActive: true
        }
      });
    });

    // Get provider settings if available
    const providerSettings = await safePrismaQuery(async (client) => {
      return await client.providerSettings.findUnique({
        where: { providerId: userId }
      });
    });

    // Mock settings structure (in a real app, these would come from a settings table)
    const settings = {
      business: {
        businessName: user?.businessName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: venues[0]?.address || '',
        city: venues[0]?.city || '',
        postcode: venues[0]?.postcode || '',
        website: '',
        description: '',
        timezone: 'Europe/London',
        currency: 'GBP'
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: false
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordExpiry: 90
      },
      payment: {
        stripePublicKey: '',
        stripeSecretKey: '',
        paypalClientId: '',
        paypalSecret: ''
      },
      tfc: providerSettings ? {
        tfcEnabled: providerSettings.tfcEnabled,
        tfcHoldPeriod: providerSettings.tfcHoldPeriod,
        tfcInstructions: providerSettings.tfcInstructions,
        tfcPayeeName: providerSettings.tfcPayeeName,
        tfcPayeeReference: providerSettings.tfcPayeeReference,
        tfcSortCode: providerSettings.tfcSortCode,
        tfcAccountNumber: providerSettings.tfcAccountNumber,
        defaultRefundMethod: providerSettings.defaultRefundMethod,
        adminFeeAmount: providerSettings.adminFeeAmount,
        creditExpiryMonths: providerSettings.creditExpiryMonths
      } : {
        tfcEnabled: false,
        tfcHoldPeriod: 5,
        tfcInstructions: '',
        tfcPayeeName: '',
        tfcPayeeReference: '',
        tfcSortCode: '',
        tfcAccountNumber: '',
        defaultRefundMethod: 'credit',
        adminFeeAmount: 2.00,
        creditExpiryMonths: 12
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Error fetching business settings:', error);
    throw new AppError('Failed to fetch settings', 500, 'SETTINGS_FETCH_ERROR');
  }
}));

// Update business settings
router.put('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { 
    business, 
    notifications, 
    security, 
    payment, 
    tfc 
  } = req.body;
  
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

    // Update user information
    if (business) {
      const userUpdateData: any = {};
      if (business.businessName !== undefined) userUpdateData.businessName = business.businessName;
      if (business.email !== undefined) userUpdateData.email = business.email;
      if (business.phone !== undefined) userUpdateData.phone = business.phone;

      if (Object.keys(userUpdateData).length > 0) {
        await safePrismaQuery(async (client) => {
          return await client.user.update({
            where: { id: userId },
            data: userUpdateData
          });
        });
      }
    }

    // Update provider settings (TFC settings)
    if (tfc) {
      const providerUpdateData: any = {
        providerId: userId,
        tfcEnabled: tfc.tfcEnabled !== undefined ? tfc.tfcEnabled : false,
        tfcHoldPeriod: tfc.tfcHoldPeriod !== undefined ? tfc.tfcHoldPeriod : 5,
        tfcInstructions: tfc.tfcInstructions || '',
        tfcPayeeName: tfc.tfcPayeeName || '',
        tfcPayeeReference: tfc.tfcPayeeReference || '',
        tfcSortCode: tfc.tfcSortCode || '',
        tfcAccountNumber: tfc.tfcAccountNumber || '',
        defaultRefundMethod: tfc.defaultRefundMethod || 'credit',
        adminFeeAmount: tfc.adminFeeAmount !== undefined ? tfc.adminFeeAmount : 2.00,
        creditExpiryMonths: tfc.creditExpiryMonths !== undefined ? tfc.creditExpiryMonths : 12
      };

      await safePrismaQuery(async (client) => {
        return await client.providerSettings.upsert({
          where: { providerId: userId },
          update: providerUpdateData,
          create: providerUpdateData
        });
      });
    }

    // Get updated settings
    const updatedUser = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          businessName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    const updatedProviderSettings = await safePrismaQuery(async (client) => {
      return await client.providerSettings.findUnique({
        where: { providerId: userId }
      });
    });

    const updatedSettings = {
      business: {
        businessName: updatedUser?.businessName || '',
        email: updatedUser?.email || '',
        phone: updatedUser?.phone || '',
        address: business?.address || '',
        city: business?.city || '',
        postcode: business?.postcode || '',
        website: business?.website || '',
        description: business?.description || '',
        timezone: business?.timezone || 'Europe/London',
        currency: business?.currency || 'GBP'
      },
      notifications: notifications || {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: false
      },
      security: security || {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordExpiry: 90
      },
      payment: payment || {
        stripePublicKey: '',
        stripeSecretKey: '',
        paypalClientId: '',
        paypalSecret: ''
      },
      tfc: updatedProviderSettings ? {
        tfcEnabled: updatedProviderSettings.tfcEnabled,
        tfcHoldPeriod: updatedProviderSettings.tfcHoldPeriod,
        tfcInstructions: updatedProviderSettings.tfcInstructions,
        tfcPayeeName: updatedProviderSettings.tfcPayeeName,
        tfcPayeeReference: updatedProviderSettings.tfcPayeeReference,
        tfcSortCode: updatedProviderSettings.tfcSortCode,
        tfcAccountNumber: updatedProviderSettings.tfcAccountNumber,
        defaultRefundMethod: updatedProviderSettings.defaultRefundMethod,
        adminFeeAmount: updatedProviderSettings.adminFeeAmount,
        creditExpiryMonths: updatedProviderSettings.creditExpiryMonths
      } : {
        tfcEnabled: false,
        tfcHoldPeriod: 5,
        tfcInstructions: '',
        tfcPayeeName: '',
        tfcPayeeReference: '',
        tfcSortCode: '',
        tfcAccountNumber: '',
        defaultRefundMethod: 'credit',
        adminFeeAmount: 2.00,
        creditExpiryMonths: 12
      }
    };

    res.json({
      success: true,
      data: updatedSettings
    });

  } catch (error) {
    logger.error('Error updating business settings:', error);
    throw new AppError('Failed to update settings', 500, 'SETTINGS_UPDATE_ERROR');
  }
}));

// Get business statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
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

    // Get business statistics
    const stats = await safePrismaQuery(async (client) => {
      const [
        totalVenues,
        totalActivities,
        totalBookings,
        totalRevenue,
        activeUsers
      ] = await Promise.all([
        client.venue.count({ where: { ownerId: userId } }),
        client.activity.count({ where: { venueId: { in: venueIds } } }),
        client.booking.count({ 
          where: { 
            activity: { 
              venueId: { in: venueIds } 
            } 
          } 
        }),
        client.payment.aggregate({
          where: {
            booking: {
              activity: {
                venueId: { in: venueIds }
              }
            },
            status: 'completed'
          },
          _sum: { amount: true }
        }),
        client.user.count({ 
          where: { 
            role: { in: ['staff', 'instructor', 'admin', 'business'] },
            isActive: true
          } 
        })
      ]);

      return {
        totalVenues,
        totalActivities,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeUsers
      };
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching business statistics:', error);
    throw new AppError('Failed to fetch statistics', 500, 'STATS_FETCH_ERROR');
  }
}));

export default router;

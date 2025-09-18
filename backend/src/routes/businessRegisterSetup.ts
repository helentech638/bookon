import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get register setups for business
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, status, page = 1, limit = 20 } = req.query;
  
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

    // For now, return empty array since we don't have register setup table yet
    // This can be extended when register setup functionality is fully implemented
    res.status(200).json({
      success: true,
      data: {
        registerSetups: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching register setups:', error);
    throw error;
  }
}));

// Create new register setup
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    description,
    defaultCapacity,
    allowWaitlist,
    autoConfirm,
    requireApproval,
    cancellationPolicy,
    refundPolicy
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

    // Validate required fields
    if (!name || !description) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // For now, return success without creating actual record
    // This can be extended when register setup table is created
    const registerSetup = {
      id: `temp_${Date.now()}`,
      name,
      description,
      defaultCapacity: Number(defaultCapacity) || 20,
      allowWaitlist: allowWaitlist || false,
      autoConfirm: autoConfirm || false,
      requireApproval: requireApproval || false,
      cancellationPolicy: cancellationPolicy || '',
      refundPolicy: refundPolicy || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.info('Register setup created (temporary)', { registerSetupId: registerSetup.id, userId });

    res.status(201).json({
      success: true,
      message: 'Register setup created successfully',
      data: registerSetup
    });

  } catch (error) {
    logger.error('Error creating register setup:', error);
    throw error;
  }
}));

// Update register setup
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const updateData = req.body;

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

    // For now, return success without updating actual record
    const updatedSetup = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    logger.info('Register setup updated (temporary)', { registerSetupId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Register setup updated successfully',
      data: updatedSetup
    });

  } catch (error) {
    logger.error('Error updating register setup:', error);
    throw error;
  }
}));

// Delete register setup
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

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

    logger.info('Register setup deleted (temporary)', { registerSetupId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Register setup deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting register setup:', error);
    throw error;
  }
}));

export default router;

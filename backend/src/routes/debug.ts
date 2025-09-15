import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Debug endpoint to check user role and permissions
router.get('/user-info', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Get user info from database
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          businessName: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    // Check if user has venues (for business users)
    const venues = await safePrismaQuery(async (client) => {
      return await client.venue.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          isActive: true
        }
      });
    });

    logger.info('Debug user info requested', {
      userId,
      userRole: userInfo.role,
      businessName: userInfo.businessName,
      venueCount: venues.length
    });

    res.json({
      success: true,
      data: {
        user: userInfo,
        venues: venues,
        tokenInfo: {
          userId: req.user!.id,
          email: req.user!.email,
          role: req.user!.role,
          isActive: req.user!.isActive,
          emailVerified: req.user!.emailVerified
        },
        permissions: {
          canAccessBusinessDashboard: userInfo.role === 'business',
          canAccessParentDashboard: ['parent', 'staff', 'admin'].includes(userInfo.role),
          hasVenues: venues.length > 0
        }
      }
    });

  } catch (error) {
    logger.error('Debug user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Debug endpoint to check business dashboard access
router.get('/business-dashboard-access', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  try {
    // Get user info
    const userInfo = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          businessName: true,
          isActive: true
        }
      });
    });

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check access
    const hasAccess = userInfo.role === 'business' && userInfo.isActive;
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: userInfo.role !== 'business' ? 'User role is not business' : 'User is not active',
        userRole: userInfo.role,
        isActive: userInfo.isActive
      });
    }

    res.json({
      success: true,
      message: 'Access granted',
      data: {
        userRole: userInfo.role,
        businessName: userInfo.businessName,
        isActive: userInfo.isActive
      }
    });

  } catch (error) {
    logger.error('Business dashboard access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;

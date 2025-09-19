import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../utils/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Get child permissions
router.get('/:childId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify the child belongs to the user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });

    if (!child) {
      throw new AppError('Child not found or access denied', 404, 'CHILD_NOT_FOUND');
    }

    // Get or create permissions
    let permissions = await prisma.childPermission.findUnique({
      where: { childId }
    });

    if (!permissions) {
      permissions = await prisma.childPermission.create({
        data: {
          childId,
          consentToWalkHome: false,
          consentToPhotography: false,
          consentToFirstAid: false,
          consentToEmergencyContact: false
        }
      });
    }

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error fetching child permissions:', error);
    throw new AppError('Failed to fetch child permissions', 500, 'PERMISSIONS_FETCH_ERROR');
  }
}));

// Update child permissions
router.put('/:childId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const userId = req.user!.id;
  const {
    consentToWalkHome,
    consentToPhotography,
    consentToFirstAid,
    consentToEmergencyContact
  } = req.body;

  try {
    // Verify the child belongs to the user
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });

    if (!child) {
      throw new AppError('Child not found or access denied', 404, 'CHILD_NOT_FOUND');
    }

    // Update or create permissions
    const permissions = await prisma.childPermission.upsert({
      where: { childId },
      update: {
        consentToWalkHome: consentToWalkHome ?? false,
        consentToPhotography: consentToPhotography ?? false,
        consentToFirstAid: consentToFirstAid ?? false,
        consentToEmergencyContact: consentToEmergencyContact ?? false
      },
      create: {
        childId,
        consentToWalkHome: consentToWalkHome ?? false,
        consentToPhotography: consentToPhotography ?? false,
        consentToFirstAid: consentToFirstAid ?? false,
        consentToEmergencyContact: consentToEmergencyContact ?? false
      }
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error updating child permissions:', error);
    throw new AppError('Failed to update child permissions', 500, 'PERMISSIONS_UPDATE_ERROR');
  }
}));

// Get all children permissions for a user
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const children = await prisma.child.findMany({
      where: { parentId: userId },
      include: {
        permissions: true
      }
    });

    // Ensure all children have permissions records
    const childrenWithPermissions = await Promise.all(
      children.map(async (child) => {
        if (!child.permissions) {
          const permissions = await prisma.childPermission.create({
            data: {
              childId: child.id,
              consentToWalkHome: false,
              consentToPhotography: false,
              consentToFirstAid: false,
              consentToEmergencyContact: false
            }
          });
          return { ...child, permissions };
        }
        return child;
      })
    );

    res.json({
      success: true,
      data: childrenWithPermissions
    });
  } catch (error) {
    logger.error('Error fetching children permissions:', error);
    throw new AppError('Failed to fetch children permissions', 500, 'CHILDREN_PERMISSIONS_FETCH_ERROR');
  }
}));

export default router;

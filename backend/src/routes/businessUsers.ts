import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// Get business users (staff, instructors, admins)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, role, status, page = 1, limit = 20 } = req.query;
  
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

    // Build where clause for business users
    const where: any = {
      role: { in: ['staff', 'instructor', 'admin', 'business'] }
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    // Get users with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [users, totalCount] = await safePrismaQuery(async (client) => {
      return await Promise.all([
        client.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            businessName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        client.user.count({ where })
      ]);
    });

    // Get summary statistics
    const stats = await safePrismaQuery(async (client) => {
      const [totalUsers, admins, instructors, staff, activeUsers] = await Promise.all([
        client.user.count({ where: { role: { in: ['staff', 'instructor', 'admin', 'business'] } } }),
        client.user.count({ where: { role: 'admin' } }),
        client.user.count({ where: { role: 'instructor' } }),
        client.user.count({ where: { role: 'staff' } }),
        client.user.count({ where: { role: { in: ['staff', 'instructor', 'admin', 'business'] }, isActive: true } })
      ]);

      return { totalUsers, admins, instructors, staff, activeUsers };
    });

    res.json({
      success: true,
      data: {
        users,
        stats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business users:', error);
    throw new AppError('Failed to fetch users', 500, 'USERS_FETCH_ERROR');
  }
}));

// Get single user
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
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

    const user = await safePrismaQuery(async (client) => {
      return await client.user.findFirst({
        where: { 
          id,
          role: { in: ['staff', 'instructor', 'admin', 'business'] }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          businessName: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    throw new AppError('Failed to fetch user', 500, 'USER_FETCH_ERROR');
  }
}));

// Create user
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    role = 'staff', 
    businessName,
    password = 'TempPassword123!'
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
    if (!firstName || !lastName || !email) {
      throw new AppError('First name, last name, and email are required', 400, 'VALIDATION_ERROR');
    }

    // Validate role
    if (!['staff', 'instructor', 'admin', 'business'].includes(role)) {
      throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
    }

    // Check if email already exists
    const existingUser = await safePrismaQuery(async (client) => {
      return await client.user.findUnique({
        where: { email }
      });
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const saltRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await safePrismaQuery(async (client) => {
      return await client.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          role,
          businessName: role === 'business' ? businessName : null,
          password_hash: passwordHash,
          isActive: true,
          emailVerified: false
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          businessName: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.status(201).json({
      success: true,
      data: newUser
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    throw new AppError('Failed to create user', 500, 'USER_CREATE_ERROR');
  }
}));

// Update user
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    role, 
    businessName,
    isActive
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

    // Check if user exists
    const existingUser = await safePrismaQuery(async (client) => {
      return await client.user.findFirst({
        where: { 
          id,
          role: { in: ['staff', 'instructor', 'admin', 'business'] }
        }
      });
    });

    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await safePrismaQuery(async (client) => {
        return await client.user.findUnique({
          where: { email }
        });
      });

      if (emailExists) {
        throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
      }
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) {
      if (!['staff', 'instructor', 'admin', 'business'].includes(role)) {
        throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
      }
      updateData.role = role;
    }
    if (businessName !== undefined) updateData.businessName = businessName;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await safePrismaQuery(async (client) => {
      return await client.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          businessName: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    throw new AppError('Failed to update user', 500, 'USER_UPDATE_ERROR');
  }
}));

// Delete user
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

    // Prevent self-deletion
    if (id === userId) {
      throw new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    // Check if user exists
    const existingUser = await safePrismaQuery(async (client) => {
      return await client.user.findFirst({
        where: { 
          id,
          role: { in: ['staff', 'instructor', 'admin', 'business'] }
        }
      });
    });

    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await safePrismaQuery(async (client) => {
      return await client.user.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    throw new AppError('Failed to delete user', 500, 'USER_DELETE_ERROR');
  }
}));

// Toggle user status
router.patch('/:id/toggle', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
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

    // Prevent self-deactivation
    if (id === userId) {
      throw new AppError('Cannot deactivate your own account', 400, 'CANNOT_DEACTIVATE_SELF');
    }

    // Check if user exists
    const existingUser = await safePrismaQuery(async (client) => {
      return await client.user.findFirst({
        where: { 
          id,
          role: { in: ['staff', 'instructor', 'admin', 'business'] }
        }
      });
    });

    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = await safePrismaQuery(async (client) => {
      return await client.user.update({
        where: { id },
        data: { isActive: !existingUser.isActive },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          businessName: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    logger.error('Error toggling user status:', error);
    throw new AppError('Failed to toggle user status', 500, 'USER_TOGGLE_ERROR');
  }
}));

export default router;

import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business widgets
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

    // Build where clause
    const where: any = { createdBy: userId };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    // Get widgets with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [widgets, totalCount] = await safePrismaQuery(async (client) => {
      return await Promise.all([
        client.widgetConfig.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        client.widgetConfig.count({ where })
      ]);
    });

    res.status(200).json({
      success: true,
      data: {
        widgets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business widgets:', error);
    throw error;
  }
}));

// Create new widget
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    description,
    theme,
    primaryColor,
    secondaryColor,
    position,
    showLogo,
    customCSS
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
    if (!name || !theme || !primaryColor || !position) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Generate embed code
    const embedCode = `<script src="https://widget.bookon.com/widget.js" data-widget-id="${Date.now()}"></script>`;

    // Create widget
    const widget = await safePrismaQuery(async (client) => {
      return await client.widgetConfig.create({
        data: {
          name,
          description: description || '',
          theme,
          primaryColor,
          secondaryColor: secondaryColor || primaryColor,
          position,
          showLogo: showLogo !== false,
          customCSS: customCSS || '',
          isActive: true,
          createdBy: userId
        }
      });
    });

    logger.info('Widget created', { widgetId: widget.id, userId });

    res.status(201).json({
      success: true,
      message: 'Widget created successfully',
      data: {
        ...widget,
        embedCode
      }
    });

  } catch (error) {
    logger.error('Error creating widget:', error);
    throw error;
  }
}));

// Update widget
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

    // Check if widget exists and belongs to user
    const existingWidget = await safePrismaQuery(async (client) => {
      return await client.widgetConfig.findFirst({
        where: { id, createdBy: userId }
      });
    });

    if (!existingWidget) {
      throw new AppError('Widget not found', 404, 'WIDGET_NOT_FOUND');
    }

    // Update widget
    const updatedWidget = await safePrismaQuery(async (client) => {
      return await client.widgetConfig.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
    });

    logger.info('Widget updated', { widgetId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Widget updated successfully',
      data: updatedWidget
    });

  } catch (error) {
    logger.error('Error updating widget:', error);
    throw error;
  }
}));

// Delete widget
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

    // Check if widget exists and belongs to user
    const existingWidget = await safePrismaQuery(async (client) => {
      return await client.widgetConfig.findFirst({
        where: { id, createdBy: userId }
      });
    });

    if (!existingWidget) {
      throw new AppError('Widget not found', 404, 'WIDGET_NOT_FOUND');
    }

    // Delete widget
    await safePrismaQuery(async (client) => {
      return await client.widgetConfig.delete({
        where: { id }
      });
    });

    logger.info('Widget deleted', { widgetId: id, userId });

    res.status(200).json({
      success: true,
      message: 'Widget deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting widget:', error);
    throw error;
  }
}));

// Get widget by ID
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

    // Get widget
    const widget = await safePrismaQuery(async (client) => {
      return await client.widgetConfig.findFirst({
        where: { id, createdBy: userId }
      });
    });

    if (!widget) {
      throw new AppError('Widget not found', 404, 'WIDGET_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: widget
    });

  } catch (error) {
    logger.error('Error fetching widget:', error);
    throw error;
  }
}));

export default router;

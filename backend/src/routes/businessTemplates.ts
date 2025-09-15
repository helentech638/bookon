import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get business templates
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { search, type, status, page = 1, limit = 20 } = req.query;
  
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
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { subjectTemplate: { contains: search as string, mode: 'insensitive' } },
        { bodyHtmlTemplate: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.trigger = type;
    }

    if (status) {
      if (status === 'active') {
        where.active = true;
      } else if (status === 'inactive') {
        where.active = false;
      }
    }

    // Get templates with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const [templates, totalCount] = await safePrismaQuery(async (client) => {
      return await Promise.all([
        client.emailTemplate.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            trigger: true,
            subjectTemplate: true,
            bodyHtmlTemplate: true,
            active: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        client.emailTemplate.count({ where })
      ]);
    });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching business templates:', error);
    throw new AppError('Failed to fetch templates', 500, 'TEMPLATES_FETCH_ERROR');
  }
}));

// Get single template
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

    const template = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          trigger: true,
          subjectTemplate: true,
          bodyHtmlTemplate: true,
          bodyTextTemplate: true,
          active: true,
          brandOverrides: true,
          placeholders: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error fetching template:', error);
    throw new AppError('Failed to fetch template', 500, 'TEMPLATE_FETCH_ERROR');
  }
}));

// Create template
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, trigger, subjectTemplate, bodyHtmlTemplate, bodyTextTemplate, active = true, brandOverrides, placeholders = [] } = req.body;
  
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
    if (!name || !trigger || !subjectTemplate || !bodyHtmlTemplate) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    const template = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.create({
        data: {
          name,
          trigger,
          subjectTemplate,
          bodyHtmlTemplate,
          bodyTextTemplate,
          active,
          brandOverrides: brandOverrides || {},
          placeholders,
          createdBy: userId
        },
        select: {
          id: true,
          name: true,
          trigger: true,
          subjectTemplate: true,
          bodyHtmlTemplate: true,
          bodyTextTemplate: true,
          active: true,
          brandOverrides: true,
          placeholders: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.status(201).json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error creating template:', error);
    throw new AppError('Failed to create template', 500, 'TEMPLATE_CREATE_ERROR');
  }
}));

// Update template
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, trigger, subjectTemplate, bodyHtmlTemplate, bodyTextTemplate, active, brandOverrides, placeholders } = req.body;
  
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

    // Check if template exists
    const existingTemplate = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.findUnique({
        where: { id }
      });
    });

    if (!existingTemplate) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (subjectTemplate !== undefined) updateData.subjectTemplate = subjectTemplate;
    if (bodyHtmlTemplate !== undefined) updateData.bodyHtmlTemplate = bodyHtmlTemplate;
    if (bodyTextTemplate !== undefined) updateData.bodyTextTemplate = bodyTextTemplate;
    if (active !== undefined) updateData.active = active;
    if (brandOverrides !== undefined) updateData.brandOverrides = brandOverrides;
    if (placeholders !== undefined) updateData.placeholders = placeholders;

    const template = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          trigger: true,
          subjectTemplate: true,
          bodyHtmlTemplate: true,
          bodyTextTemplate: true,
          active: true,
          brandOverrides: true,
          placeholders: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error updating template:', error);
    throw new AppError('Failed to update template', 500, 'TEMPLATE_UPDATE_ERROR');
  }
}));

// Delete template
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

    // Check if template exists
    const existingTemplate = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.findUnique({
        where: { id }
      });
    });

    if (!existingTemplate) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    await safePrismaQuery(async (client) => {
      return await client.emailTemplate.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting template:', error);
    throw new AppError('Failed to delete template', 500, 'TEMPLATE_DELETE_ERROR');
  }
}));

// Toggle template status
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

    // Check if template exists
    const existingTemplate = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.findUnique({
        where: { id }
      });
    });

    if (!existingTemplate) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    const template = await safePrismaQuery(async (client) => {
      return await client.emailTemplate.update({
        where: { id },
        data: { active: !existingTemplate.active },
        select: {
          id: true,
          name: true,
          trigger: true,
          subjectTemplate: true,
          bodyHtmlTemplate: true,
          bodyTextTemplate: true,
          active: true,
          brandOverrides: true,
          placeholders: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error toggling template status:', error);
    throw new AppError('Failed to toggle template status', 500, 'TEMPLATE_TOGGLE_ERROR');
  }
}));

export default router;

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../utils/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
// router.use(authenticateToken);
// router.use(requireRole(['admin', 'staff']));

// Transform database fields to frontend format
const transformWidgetData = (widget: any) => ({
  id: widget.id,
  name: widget.name,
  theme: widget.theme,
  primaryColor: widget.primary_color,
  position: widget.position,
  showLogo: widget.show_logo,
  customCSS: widget.custom_css,
  isActive: widget.is_active,
  createdAt: widget.created_at,
  updatedAt: widget.updated_at
});

// Get all widget configurations
router.get('/', asyncHandler(async (_req: any, res: any) => {
  const widgets = await db('widget_configs')
    .where('is_active', true)
    .orderBy('created_at', 'desc');

  const transformedWidgets = widgets.map(transformWidgetData);

  res.json({
    success: true,
    data: transformedWidgets
  });
}));

// Get widget configuration by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid widget ID')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { id } = req.params;
  const widget = await db('widget_configs')
    .where({ id, is_active: true })
    .first();

  if (!widget) {
    return res.status(404).json({
      success: false,
      error: { message: 'Widget configuration not found' }
    });
  }

  const transformedWidget = transformWidgetData(widget);

  res.json({
    success: true,
    data: transformedWidget
  });
}));

// Create new widget configuration
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('theme').isIn(['light', 'dark', 'auto']).withMessage('Theme must be light, dark, or auto'),
  body('primaryColor').matches(/^#[0-9A-F]{6}$/i).withMessage('Primary color must be a valid hex color'),
  body('position').isIn(['bottom-right', 'bottom-left', 'top-right', 'top-left']).withMessage('Invalid position'),
  body('showLogo').isBoolean().withMessage('Show logo must be a boolean'),
  body('customCSS').optional().isString().withMessage('Custom CSS must be a string')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const {
    name,
    theme,
    primaryColor,
    position,
    showLogo,
    customCSS = ''
  } = req.body;

  const [widget] = await db('widget_configs')
    .insert({
      id: db.raw('gen_random_uuid()'),
      name,
      theme,
      primary_color: primaryColor,
      position,
      show_logo: showLogo,
      custom_css: customCSS,
      created_by: req.user!.id,
      updated_by: req.user!.id,
      is_active: true
    })
    .returning('*');

  const transformedWidget = transformWidgetData(widget);
  
  res.status(201).json({
    success: true,
    data: transformedWidget
  });
}));

// Update widget configuration
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid widget ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Theme must be light, dark, or auto'),
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Primary color must be a valid hex color'),
  body('position').optional().isIn(['bottom-right', 'bottom-left', 'top-right', 'top-left']).withMessage('Invalid position'),
  body('showLogo').optional().isBoolean().withMessage('Show logo must be a boolean'),
  body('customCSS').optional().isString().withMessage('Custom CSS must be a string')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { id } = req.params;
  const updateData = {
    ...req.body,
    primary_color: req.body.primaryColor,
    show_logo: req.body.showLogo,
    custom_css: req.body.customCSS,
    updated_by: req.user!.id,
    updated_at: new Date()
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const [updatedWidget] = await db('widget_configs')
    .where({ id, is_active: true })
    .update(updateData)
    .returning('*');

  if (!updatedWidget) {
    return res.status(404).json({
      success: false,
      error: { message: 'Widget configuration not found' }
    });
  }

  const transformedWidget = transformWidgetData(updatedWidget);
  
  res.json({
    success: true,
    data: transformedWidget
  });
}));

// Toggle widget active status
router.patch('/:id/toggle', [
  param('id').isUUID().withMessage('Invalid widget ID')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { id } = req.params;
  const widget = await db('widget_configs')
    .where({ id, is_active: true })
    .first();

  if (!widget) {
    return res.status(404).json({
      success: false,
      error: { message: 'Widget configuration not found' }
    });
  }

  const [updatedWidget] = await db('widget_configs')
    .where({ id })
    .update({
      is_active: !widget.is_active,
      updated_by: req.user!.id,
      updated_at: new Date()
    })
    .returning('*');

  const transformedWidget = transformWidgetData(updatedWidget);
  
  res.json({
    success: true,
    data: transformedWidget
  });
}));

// Delete widget configuration (soft delete)
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid widget ID')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors.array() }
    });
  }

  const { id } = req.params;
  const [deletedWidget] = await db('widget_configs')
    .where({ id, is_active: true })
    .update({
      is_active: false,
      deleted_by: req.user!.id,
      deleted_at: new Date(),
      updated_by: req.user!.id,
      updated_at: new Date()
    })
    .returning('*');

  if (!deletedWidget) {
    return res.status(404).json({
      success: false,
      error: { message: 'Widget configuration not found' }
    });
  }

  res.json({
    success: true,
    message: 'Widget configuration deleted successfully'
  });
}));

export default router;

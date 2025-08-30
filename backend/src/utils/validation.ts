import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Common validation schemas
export const userValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 characters)'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (max 50 characters)'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    body('role').optional().isIn(['parent', 'staff', 'admin']).withMessage('Invalid role'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
};

export const venueValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Venue name is required (max 100 characters)'),
    body('address').trim().isLength({ min: 1, max: 500 }).withMessage('Address is required (max 500 characters)'),
    body('city').trim().isLength({ min: 1, max: 100 }).withMessage('City is required (max 100 characters)'),
    body('postcode').trim().isLength({ min: 1, max: 10 }).withMessage('Postcode is required (max 10 characters)'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
  ],
  update: [
    param('id').isUUID().withMessage('Valid venue ID is required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Venue name must be 1-100 characters'),
    body('address').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Address must be 1-500 characters'),
    body('city').optional().trim().isLength({ min: 1, max: 100 }).withMessage('City must be 1-100 characters'),
    body('postcode').optional().trim().isLength({ min: 1, max: 10 }).withMessage('Postcode must be 1-10 characters'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
  ],
};

export const activityValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Activity name is required (max 100 characters)'),
    body('venueId').isUUID().withMessage('Valid venue ID is required'),
    body('description').trim().isLength({ min: 1, max: 1000 }).withMessage('Description is required (max 1000 characters)'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    body('maxCapacity').isInt({ min: 1 }).withMessage('Max capacity must be a positive integer'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('ageMin').optional().isInt({ min: 0, max: 18 }).withMessage('Min age must be 0-18'),
    body('ageMax').optional().isInt({ min: 0, max: 18 }).withMessage('Max age must be 0-18'),
  ],
  update: [
    param('id').isUUID().withMessage('Valid activity ID is required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Activity name must be 1-100 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be 1-1000 characters'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Max capacity must be a positive integer'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  ],
};

export const bookingValidation = {
  create: [
    body('activityId').isUUID().withMessage('Valid activity ID is required'),
    body('childId').isUUID().withMessage('Valid child ID is required'),
    body('parentId').isUUID().withMessage('Valid parent ID is required'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
  ],
  update: [
    param('id').isUUID().withMessage('Valid booking ID is required'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
  ],
};

export const paymentValidation = {
  createIntent: [
    body('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').optional().isIn(['gbp', 'usd', 'eur']).withMessage('Invalid currency'),
  ],
  confirm: [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  ],
  refund: [
    param('id').isUUID().withMessage('Valid payment ID is required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
    body('reason').optional().trim().isLength({ max: 200 }).withMessage('Refund reason must be under 200 characters'),
  ],
};

// Common query validation
export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('sortBy').optional().isString().withMessage('Sort by must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

// Validation result handler
export const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400);
  }
  next();
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Custom validators
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  if (!startHour || !startMin || !endHour || !endMin) {
    return false;
  }
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return startMinutes < endMinutes;
};

export const isValidAgeRange = (minAge: number, maxAge: number): boolean => {
  return minAge >= 0 && maxAge <= 18 && minAge <= maxAge;
};

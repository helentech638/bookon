import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || 'UNKNOWN_ERROR';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }
  // Handle JWT expiration
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle database errors
  else if (error.name === 'QueryFailedError') {
    statusCode = 400;
    message = 'Database query failed';
    code = 'DATABASE_ERROR';
  }
  // Handle duplicate key errors
  else if (error.name === 'UniqueConstraintViolationError') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  }
  // Handle foreign key constraint errors
  else if (error.name === 'ForeignKeyConstraintViolationError') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
    code = 'FOREIGN_KEY_VIOLATION';
  }
  // Handle Stripe errors
  else if (error.name === 'StripeError') {
    statusCode = 400;
    message = 'Payment processing error';
    code = 'STRIPE_ERROR';
  }

  // Log the error
  logError(error, req);

  // Don't leak error details in production
  if (process.env['NODE_ENV'] === 'production') {
    // For production, don't expose internal error details
    if (statusCode === 500) {
      message = 'Internal Server Error';
      code = 'INTERNAL_ERROR';
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: error.stack,
        details: error.message,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFound = (req: Request, res: Response): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

// Validation error handler
export const handleValidationError = (error: any): AppError => {
  const message = Object.values(error.errors)
    .map((err: any) => err.message)
    .join(', ');
  
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

// Cast error handler (for invalid ObjectId)
export const handleCastError = (error: any): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Duplicate key error handler
export const handleDuplicateKeyError = (error: any): AppError => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 409, 'DUPLICATE_RESOURCE');
};

// JWT error handler
export const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
};

// JWT expiration handler
export const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');
};

// Export default error handler
export default errorHandler;

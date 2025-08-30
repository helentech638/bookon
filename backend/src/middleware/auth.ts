import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger, logSecurity } from '../utils/logger';
import { db } from '../utils/database';
import { redis } from '../utils/redis';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
        emailVerified: boolean;
      };
    }
  }
}

// JWT token verification middleware
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401, 'TOKEN_REQUIRED');
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
    
    // Check if user still exists and is active
    const user = await db('users')
      .select('id', 'email', 'role', 'isActive')
      .where('id', decoded.userId)
      .first();

    if (!user) {
      throw new AppError('User no longer exists', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401, 'USER_DEACTIVATED');
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: false, // Default to false since column doesn't exist
    };

    // Log successful authentication
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if ((error as any).name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if ((error as any).name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Try to authenticate, but don't fail if it doesn't work
      try {
        const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
        const user = await db('users')
          .select('id', 'email', 'role', 'isActive')
          .where('id', decoded.userId)
          .first();

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: false, // Default to false since column doesn't exist
          };
        }
      } catch (error) {
        // Silently ignore authentication errors for optional auth
        logger.debug('Optional auth failed, continuing without user context');
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Role-based access control middleware
export const requireRole = (roles: string | string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logSecurity('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
      });

      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

// Admin-only access middleware
export const requireAdmin = requireRole('admin');

// Staff or admin access middleware
export const requireStaff = requireRole(['staff', 'admin']);

// Email verification required middleware
export const requireEmailVerification = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  if (!req.user.emailVerified) {
    throw new AppError('Email verification required', 403, 'EMAIL_VERIFICATION_REQUIRED');
  }

  next();
};

// Rate limiting middleware for authentication attempts
export const authRateLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `auth_attempts:${ip}`;
    
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      await redis.expire(key, 900); // 15 minutes
    }
    
    if (attempts > 5) {
      logSecurity('Rate limit exceeded for authentication', {
        ip,
        attempts,
        userAgent: req.get('User-Agent'),
      });
      
      throw new AppError('Too many authentication attempts', 429, 'RATE_LIMIT_EXCEEDED');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Session validation middleware
export const validateSession = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    // Check if user session is still valid
    const sessionKey = `session:${req.user.id}`;
    const session = await redis.get(sessionKey);
    
    if (!session) {
      throw new AppError('Session expired', 401, 'SESSION_EXPIRED');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Logout middleware (blacklist token)
export const logout = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Add token to blacklist with expiration
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${token}`, ttl, 'revoked');
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Export all middleware
export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireStaff,
  requireEmailVerification,
  authRateLimit,
  validateSession,
  logout,
};

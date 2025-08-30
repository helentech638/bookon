import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';

// Immediate logging to see if module loads
console.log('🚀 Backend module loading...');
console.log('📊 Environment:', process.env['NODE_ENV'] || 'development');
console.log('🔗 Port:', process.env['PORT'] || 3000);

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';
import childrenRoutes from './routes/children';
import dashboardRoutes from './routes/dashboard';
import activitiesRoutes from './routes/activities';
import venuesRoutes from './routes/venues';
import bookingsRoutes from './routes/bookings';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import widgetRoutes from './routes/widget';
import widgetConfigRoutes from './routes/widget-config';
import registersRoutes from './routes/registers';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';

// Import database connection
import { connectDatabase } from './utils/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
      max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
  });
});

// Debug endpoint to test server startup
app.get('/debug', (_req, res) => {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] || 'development',
    databaseUrl: process.env['DATABASE_URL'] ? 'SET' : 'MISSING',
    jwtSecret: process.env['JWT_SECRET'] ? 'SET' : 'MISSING',
  });
});

// Simple test endpoint
app.get('/test', (_req, res) => {
  res.status(200).json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: app._router.stack.map((layer: any) => layer.route?.path).filter(Boolean)
  });
});

// Very simple ping endpoint
app.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'BookOn Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      ping: '/ping',
      health: '/health',
      debug: '/debug',
      test: '/test',
      api: '/api/v1'
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/children', childrenRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/activities', activitiesRoutes);
app.use('/api/v1/venues', venuesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/widget', widgetRoutes);
app.use('/api/v1/widget-config', widgetConfigRoutes);
app.use('/api/v1/registers', registersRoutes);

// Webhook endpoint for Stripe
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting BookOn server...');
    logger.info('🚀 Starting BookOn server...');
    logger.info(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    logger.info(`🔗 Port: ${PORT}`);
    
    // Check environment variables
    const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
      logger.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
      logger.error('Please check your Vercel environment variables configuration');
      process.exit(1);
    }
    
    console.log('✅ Environment variables check passed');
    logger.info('✅ Environment variables check passed');

    // Try to connect to database (optional for startup)
    try {
      await connectDatabase();
      console.log('✅ Database connected successfully');
      logger.info('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed, continuing without database:', dbError);
      logger.warn('⚠️ Database connection failed, continuing without database:', dbError);
      logger.info('Server will run in mock mode for development');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔍 Debug info: http://localhost:${PORT}/debug`);
      logger.info(`🧪 Test endpoint: http://localhost:${PORT}/test`);
      logger.info(`📚 API docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

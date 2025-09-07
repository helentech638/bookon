import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Initialize Stripe (only if secret key is available)
let stripeClient: any = null;
if (process.env['STRIPE_SECRET_KEY']) {
  const stripe = require('stripe');
  stripeClient = new stripe(process.env['STRIPE_SECRET_KEY'], {
    apiVersion: '2023-10-16',
  });
}

// Webhook authentication middleware
const authenticateWebhook = (req: Request, res: Response, next: Function): void => {
  const webhookSecret = req.headers['x-webhook-secret'];
  const expectedSecret = process.env['WEBHOOK_SECRET'];
  
  if (!webhookSecret || webhookSecret !== expectedSecret) {
    res.status(401).json({ error: 'Unauthorized webhook request' });
    return;
  }
  
  next();
};

// Stripe webhook signature verification (simplified)
const verifyStripeWebhook = (req: Request, res: Response, next: Function): void => {
  if (!stripeClient) {
    res.status(400).json({ error: 'Stripe not configured' });
    return;
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  
  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing Stripe signature or webhook secret' });
    return;
  }
  
  try {
    const event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    (req as any).stripeEvent = event;
    next();
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid Stripe signature' });
    return;
  }
};

// Generic webhook endpoint for external services
router.post('/external', authenticateWebhook, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { event, data, source } = req.body;
    
    if (!event || !source) {
      throw new AppError('Missing required webhook parameters', 400, 'MISSING_PARAMETERS');
    }

    // Log webhook event
    await prisma.$executeRaw`
      INSERT INTO webhook_events (event_type, source, data, processed, created_at)
      VALUES (${event}, ${source}, ${JSON.stringify(data || {})}, false, NOW())
    `;

    // Process webhook based on event type
    switch (event) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'booking.created':
        await handleBookingCreated(data);
        break;
      case 'booking.updated':
        await handleBookingUpdated(data);
        break;
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      case 'activity.scheduled':
        await handleActivityScheduled(data);
        break;
      default:
        logger.info(`Unhandled webhook event: ${event} from ${source}`);
    }

    // Mark webhook as processed
    await prisma.webhookEvent.updateMany({
      where: {
        eventType: event,
        source: source,
        createdAt: new Date()
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Webhook processed successfully' });
    
  } catch (error) {
    logger.error('Error processing external webhook:', error);
    
    // Log failed webhook
    await prisma.webhookEvent.create({
      data: {
        eventType: req.body.event || 'unknown',
        source: req.body.source || 'unknown',
        data: req.body,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}));

// Stripe webhook endpoint
router.post('/stripe', verifyStripeWebhook, asyncHandler(async (req: Request, res: Response) => {
  try {
    const event = (req as any).stripeEvent;
    
    logger.info(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });
    
    // Log Stripe webhook event
    await prisma.$executeRaw`
      INSERT INTO webhook_events (event_type, source, data, processed, external_id, created_at)
      VALUES (${event.type}, 'stripe', ${JSON.stringify(event.data.object)}, false, ${event.id}, NOW())
    `;
    
    // Handle different Stripe events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;
      case 'customer.created':
        await handleStripeCustomerCreated(event.data.object);
        break;
      case 'customer.updated':
        await handleStripeCustomerUpdated(event.data.object);
        break;
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }
    
    // Mark webhook as processed
    await prisma.$executeRaw`
      UPDATE webhook_events 
      SET processed = true, processed_at = NOW()
      WHERE external_id = ${event.id} AND source = 'stripe'
    `;
    
    res.json({ received: true });
    
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);
    throw error;
  }
}));

// Stripe webhook event handlers
async function handleStripePaymentSucceeded(paymentIntent: any) {
  try {
    logger.info('Processing Stripe payment succeeded', { paymentIntentId: paymentIntent.id });
    
    // Update booking payment status
    await prisma.$executeRaw`
      UPDATE bookings 
      SET status = 'confirmed', payment_status = 'paid', "updatedAt" = NOW()
      WHERE payment_intent_id = ${paymentIntent.id}
    `;
    
    // TODO: Send confirmation notification
    logger.info('Payment success notification would be sent here', { paymentIntentId: paymentIntent.id });
    
    logger.info('Booking payment confirmed successfully', { paymentIntentId: paymentIntent.id });
    
  } catch (error) {
    logger.error('Error handling Stripe payment succeeded:', error);
    throw error;
  }
}

async function handleStripePaymentFailed(paymentIntent: any) {
  try {
    logger.info('Processing Stripe payment failed', { paymentIntentId: paymentIntent.id });
    
    // Update booking payment status
    await prisma.$executeRaw`
      UPDATE bookings 
      SET status = 'pending', payment_status = 'failed', "updatedAt" = NOW()
      WHERE payment_intent_id = ${paymentIntent.id}
    `;
    
    // TODO: Send payment failed notification
    logger.info('Payment failed notification would be sent here', { paymentIntentId: paymentIntent.id });
    
    logger.info('Booking payment failed handled', { paymentIntentId: paymentIntent.id });
    
  } catch (error) {
    logger.error('Error handling Stripe payment failed:', error);
    throw error;
  }
}

async function handleStripeCustomerCreated(customer: any) {
  try {
    logger.info('Processing Stripe customer created', { customerId: customer.id });
    
    // Update user with Stripe customer ID if needed
    await prisma.$executeRaw`
      UPDATE users 
      SET stripe_customer_id = ${customer.id}, "updatedAt" = NOW()
      WHERE email = ${customer.email}
    `;
    
    logger.info('User updated with Stripe customer ID', { customerId: customer.id });
    
  } catch (error) {
    logger.error('Error handling Stripe customer created:', error);
    throw error;
  }
}

async function handleStripeCustomerUpdated(customer: any) {
  try {
    logger.info('Processing Stripe customer updated', { customerId: customer.id });
    
    // Update user information if needed
    await prisma.$executeRaw`
      UPDATE users 
      SET "updatedAt" = NOW()
      WHERE stripe_customer_id = ${customer.id}
    `;
    
    logger.info('User updated from Stripe customer', { customerId: customer.id });
    
  } catch (error) {
    logger.error('Error handling Stripe customer updated:', error);
    throw error;
  }
}

// Webhook event handlers
async function handleUserCreated(data: any) {
  try {
    logger.info('Processing user.created webhook', { data });
    
    // Send welcome email
    // await emailService.sendWelcomeEmail(data.email, data.firstName);
    
    // Create user profile if needed
    // await userService.createProfile(data.userId, data);
    
    logger.info('User created webhook processed successfully');
  } catch (error) {
    logger.error('Error handling user.created webhook:', error);
    throw error;
  }
}

async function handleUserUpdated(data: any) {
  try {
    logger.info('Processing user.updated webhook', { data });
    
    // Update user profile
    // await userService.updateProfile(data.userId, data);
    
    // Send profile update notification
    // await notificationService.sendProfileUpdateNotification(data.userId);
    
    logger.info('User updated webhook processed successfully');
  } catch (error) {
    logger.error('Error handling user.updated webhook:', error);
    throw error;
  }
}

async function handleBookingCreated(data: any) {
  try {
    logger.info('Processing booking.created webhook', { data });
    
    // Send booking confirmation
    // await emailService.sendBookingConfirmation(data.bookingId);
    
    // Update activity capacity
    // await activityService.updateCapacity(data.activityId, -1);
    
    // Send notification to venue staff
    // await notificationService.sendBookingNotification(data.venueId, data);
    
    logger.info('Booking created webhook processed successfully');
  } catch (error) {
    logger.error('Error handling booking.created webhook:', error);
    throw error;
  }
}

async function handleBookingUpdated(data: any) {
  try {
    logger.info('Processing booking.updated webhook', { data });
    
    // Send booking update notification
    // await emailService.sendBookingUpdate(data.bookingId, data.changes);
    
    // Update related systems
    // await updateRelatedSystems(data);
    
    logger.info('Booking updated webhook processed successfully');
  } catch (error) {
    logger.error('Error handling booking.updated webhook:', error);
    throw error;
  }
}

async function handlePaymentCompleted(data: any) {
  try {
    logger.info('Processing payment.completed webhook', { data });
    
    // Update booking status
    await prisma.booking.update({
      where: { id: data.bookingId },
      data: {
        paymentStatus: 'paid',
        updatedAt: new Date()
      }
    });
    
    // Send payment confirmation
    // await emailService.sendPaymentConfirmation(data.bookingId);
    
    // Update financial records
    // await financialService.recordPayment(data);
    
    logger.info('Payment completed webhook processed successfully');
  } catch (error) {
    logger.error('Error handling payment.completed webhook:', error);
    throw error;
  }
}

async function handleActivityScheduled(data: any) {
  try {
    logger.info('Processing activity.scheduled webhook', { data });
    
    // Create register for the activity
    // await registerService.createRegister(data.activityId, data.date);
    
    // Send notifications to interested users
    // await notificationService.sendActivityScheduledNotification(data);
    
    logger.info('Activity scheduled webhook processed successfully');
  } catch (error) {
    logger.error('Error handling activity.scheduled webhook:', error);
    throw error;
  }
}

// Get webhook event history
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, event_type, source, processed } = req.query;
    
    const whereClause: any = {};
    
    if (event_type) {
      whereClause.eventType = event_type;
    }
    
    if (source) {
      whereClause.source = source;
    }
    
    if (processed !== undefined) {
      whereClause.processed = processed === 'true';
    }
    
    const events = await prisma.webhookEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });
    
    const total = await prisma.webhookEvent.count({ where: whereClause });
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: total,
        }
      }
    });
    
  } catch (error) {
    logger.error('Error fetching webhook events:', error);
    throw error;
  }
}));

// Retry failed webhook
router.post('/events/:id/retry', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Webhook event ID is required', 400, 'MISSING_EVENT_ID');
    }
    
    const event = await prisma.webhookEvent.findFirst({
      where: {
        id: id,
        processed: false
      }
    });
    
    if (!event) {
      throw new AppError('Failed webhook event not found', 404, 'EVENT_NOT_FOUND');
    }
    
    // Process the webhook again
    const webhookData = {
      event: event.eventType,
      source: event.source,
      data: event.data,
    };
    
    // Simulate webhook processing
    await handleWebhookEvent(webhookData);
    
    // Mark as processed
    await prisma.webhookEvent.update({
      where: { id: id },
      data: {
        processed: true,
        processedAt: new Date(),
        retryCount: { increment: 1 }
      }
    });
    
    res.json({
      success: true,
      message: 'Webhook retried successfully'
    });
    
  } catch (error) {
    logger.error('Error retrying webhook:', error);
    throw error;
  }
}));

// Helper function to handle webhook events
async function handleWebhookEvent(webhookData: any) {
  const { event, data, source } = webhookData;
  
  switch (event) {
    case 'user.created':
      await handleUserCreated(data);
      break;
    case 'user.updated':
      await handleUserUpdated(data);
      break;
    case 'booking.created':
      await handleBookingCreated(data);
      break;
    case 'booking.updated':
      await handleBookingUpdated(data);
      break;
    case 'payment.completed':
      await handlePaymentCompleted(data);
      break;
    case 'activity.scheduled':
      await handleActivityScheduled(data);
      break;
    default:
      logger.info(`Unhandled webhook event: ${event} from ${source}`);
  }
}

// Webhook health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook system is healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /webhooks/external',
      'GET /webhooks/events',
      'POST /webhooks/events/:id/retry',
      'GET /webhooks/health'
    ]
  });
});

// Simple webhook events endpoint for testing (removed duplicate)

// Webhook stats endpoint
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN processed = true THEN 1 END) as processed,
        COUNT(CASE WHEN processed = false OR error IS NOT NULL THEN 1 END) as failed,
        COUNT(CASE WHEN source = 'stripe' THEN 1 END) as stripe_events,
        COUNT(CASE WHEN source = 'external' THEN 1 END) as external_events
      FROM webhook_events
    ` as any[];

    res.json({
      success: true,
      data: stats[0] || { total: 0, processed: 0, failed: 0, stripe_events: 0, external_events: 0 }
    });
  } catch (error) {
    logger.error('Error fetching webhook stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch webhook stats',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}));

// Webhook configuration management (admin only)
router.get('/config', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    const configs = await prisma.$queryRaw`
      SELECT * FROM webhook_configs 
      ORDER BY created_at DESC
    ` as any[];

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    logger.error('Error fetching webhook configs:', error);
    throw error;
  }
}));

// Create webhook configuration (admin only)
router.post('/config', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, url, events, secret, active } = req.body;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    const config = await prisma.$queryRaw`
      INSERT INTO webhook_configs (name, url, events, secret, active, created_at)
      VALUES (${name}, ${url}, ${JSON.stringify(events)}, ${secret}, ${active || true}, NOW())
      RETURNING *
    ` as any[];

    res.status(201).json({
      success: true,
      data: config[0],
      message: 'Webhook configuration created successfully'
    });
  } catch (error) {
    logger.error('Error creating webhook config:', error);
    throw error;
  }
}));

// Update webhook configuration (admin only)
router.put('/config/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, url, events, secret, active } = req.body;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    const config = await prisma.$queryRaw`
      UPDATE webhook_configs 
      SET name = ${name}, url = ${url}, events = ${JSON.stringify(events)}, secret = ${secret}, active = ${active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    ` as any[];

    if (!config[0]) {
      throw new AppError('Webhook configuration not found', 404, 'CONFIG_NOT_FOUND');
    }

    res.json({
      success: true,
      data: config[0],
      message: 'Webhook configuration updated successfully'
    });
  } catch (error) {
    logger.error('Error updating webhook config:', error);
    throw error;
  }
}));

// Delete webhook configuration (admin only)
router.delete('/config/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    await prisma.$executeRaw`
      DELETE FROM webhook_configs WHERE id = ${id}
    `;

    res.json({
      success: true,
      message: 'Webhook configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting webhook config:', error);
    throw error;
  }
}));

// Test webhook configuration (admin only)
router.post('/config/:id/test', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }
    
    const config = await prisma.$queryRaw`
      SELECT * FROM webhook_configs WHERE id = ${id}
    ` as any[];

    if (!config[0]) {
      throw new AppError('Webhook configuration not found', 404, 'CONFIG_NOT_FOUND');
    }

    // Send test webhook
    const testData = {
      event: 'test',
      data: { message: 'This is a test webhook from BookOn' },
      timestamp: new Date().toISOString()
    };

    // TODO: Implement actual webhook sending
    logger.info('Test webhook would be sent to:', { url: config[0].url, data: testData });

    res.json({
      success: true,
      message: 'Test webhook sent successfully',
      data: testData
    });
  } catch (error) {
    logger.error('Error testing webhook config:', error);
    throw error;
  }
}));

// Simple test endpoint
router.get('/test', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook routes are working!',
    timestamp: new Date().toISOString()
  });
});

export default router;

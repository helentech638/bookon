import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import stripeService from '../services/stripe';
import Stripe from 'stripe';

const router = Router();

// Validation middleware
const validatePaymentIntent = [
  body('bookingId').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isIn(['gbp', 'usd', 'eur']).withMessage('Invalid currency'),
  body('venueId').optional().isUUID().withMessage('Venue ID must be a valid UUID'),
];

// Create payment intent for a booking
router.post('/create-intent', authenticateToken, validatePaymentIntent, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { bookingId, amount, currency = 'gbp', venueId } = req.body;

    // Get booking details
    const booking = await db('bookings')
      .select(
        'bookings.*',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time',
        'venues.name as venue_name',
        'venues.stripe_account_id'
      )
      .join('activities', 'bookings.activity_id', 'activities.id')
      .join('venues', 'activities.venue_id', 'venues.id')
      .where('bookings.id', bookingId)
      .where('bookings.user_id', userId)
      .where('bookings.is_active', true)
      .first();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== 'pending') {
      throw new AppError('Booking is not in pending status', 400, 'BOOKING_NOT_PENDING');
    }

    // Check if payment already exists
    const existingPayment = await db('payments')
      .where('booking_id', bookingId)
      .where('is_active', true)
      .first();

    if (existingPayment) {
      throw new AppError('Payment already exists for this booking', 400, 'PAYMENT_ALREADY_EXISTS');
    }

    // Create Stripe payment intent with Connect support
    const paymentIntent = await stripeService.createPaymentIntent({
      bookingId,
      amount,
      currency,
      venueId: venueId || booking.venue_id,
    });

    // Create payment record in database
    const [payment] = await db('payments')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        payment_method: 'stripe',
        is_active: true,
      })
      .returning(['id', 'stripe_payment_intent_id']);

    logger.info('Payment intent created successfully', { 
      paymentId: payment.id, 
      bookingId,
      userId,
      stripeIntentId: paymentIntent.id,
      venueId: venueId || booking.venue_id
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
        booking: {
          id: booking.id,
          activityTitle: booking.activity_title,
          venueName: booking.venue_name,
          startDate: booking.start_date,
          startTime: booking.start_time,
        }
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    throw error;
  }
}));

// Confirm payment intent
router.post('/confirm', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    // const userId = req.user!.id; // Unused variable
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw new AppError('Payment intent ID is required', 400, 'MISSING_PAYMENT_INTENT_ID');
    }

    // Get payment details
    const payment = await db('payments')
      .where('stripe_payment_intent_id', paymentIntentId)
      .where('is_active', true)
      .first();

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Confirm payment intent with Stripe
    const paymentIntent = await stripeService.confirmPayment(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status
      await db('payments')
        .where('stripe_payment_intent_id', paymentIntentId)
        .update({
          status: 'completed',
          updated_at: new Date(),
        });

      // Update booking status
      await db('bookings')
        .where('id', payment.booking_id)
        .update({
          status: 'confirmed',
          updated_at: new Date(),
        });

      logger.info('Payment confirmed successfully', { paymentIntentId, bookingId: payment.booking_id });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          paymentIntentId,
          status: paymentIntent.status,
        },
      });
    } else {
      throw new AppError('Payment confirmation failed', 400, 'PAYMENT_CONFIRMATION_FAILED');
    }
  } catch (error) {
    logger.error('Error confirming payment:', error);
    if (error instanceof AppError) throw error;
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new AppError(`Payment error: ${error.message}`, 400, 'STRIPE_ERROR');
    }
    
    throw new AppError('Failed to confirm payment', 500, 'PAYMENT_CONFIRMATION_ERROR');
  }
}));

// Get payment status
router.get('/:id/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const payment = await db('payments')
      .select(
        'payments.*',
        'bookings.status as booking_status',
        'activities.title as activity_title'
      )
      .join('bookings', 'payments.booking_id', 'bookings.id')
      .join('activities', 'bookings.activity_id', 'activities.id')
      .where('payments.id', id)
      .where('payments.user_id', userId)
      .where('payments.is_active', true)
      .first();

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Get latest status from Stripe if payment intent exists
    let stripeStatus = null;
    if (payment.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripeService.getPaymentIntent(payment.stripe_payment_intent_id);
        stripeStatus = paymentIntent.status;
      } catch (stripeError) {
        logger.warn('Could not retrieve Stripe payment intent', { 
          paymentId: id, 
          stripeError 
        });
      }
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        status: payment.status,
        stripeStatus,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        bookingStatus: payment.booking_status,
        activityTitle: payment.activity_title,
        createdAt: payment.created_at,
        completedAt: payment.completed_at
      }
    });
  } catch (error) {
    logger.error('Error fetching payment status:', error);
    throw new AppError('Failed to fetch payment status', 500, 'PAYMENT_STATUS_ERROR');
  }
}));

// Get all payments for user
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { 
      page = '1', 
      limit = '10', 
      status 
    } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query = db('payments')
      .select(
        'payments.*',
        'bookings.status as booking_status',
        'activities.title as activity_title',
        'activities.start_date',
        'activities.start_time'
      )
      .join('bookings', 'payments.booking_id', 'bookings.id')
      .join('activities', 'bookings.activity_id', 'activities.id')
      .where('payments.user_id', userId)
      .where('payments.is_active', true);

    // Filter by status
    if (status && status !== 'all') {
      query = query.where('payments.status', status);
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const totalCount = await countQuery.count('* as count').first();

    // Get paginated results
    const payments = await query
      .orderBy('payments.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      success: true,
      data: payments.map(payment => ({
        id: payment.id,
        status: payment.status,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        booking: {
          status: payment.booking_status,
          activity: {
            title: payment.activity_title,
            startDate: payment.start_date,
            startTime: payment.start_time
          }
        },
        createdAt: payment.created_at,
        completedAt: payment.completed_at
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(String(totalCount?.['count'] || '0')),
        pages: Math.ceil(parseInt(String(totalCount?.['count'] || '0')) / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Error fetching payments:', error);
    throw new AppError('Failed to fetch payments', 500, 'PAYMENTS_FETCH_ERROR');
  }
}));

// Refund payment
router.post('/:id/refund', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;
    
    // Get payment record
    const payment = await db('payments')
      .where('id', id)
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400, 'PAYMENT_NOT_REFUNDABLE');
    }

    // Check if booking is within refund window (e.g., 7 days)
    const booking = await db('bookings')
      .where('id', payment.booking_id)
      .first();

    if (booking) {
      const now = new Date();
      const paymentDate = new Date(payment.completed_at);
      const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSincePayment > 7) {
        throw new AppError('Refund window has expired (7 days)', 400, 'REFUND_WINDOW_EXPIRED');
      }
    }

    // Process refund through Stripe
    let refund;
    if (payment.stripe_payment_intent_id) {
      try {
        refund = await stripeService.processRefund(payment.stripe_payment_intent_id, {
          reason: reason || 'Customer requested refund',
        });
      } catch (stripeError) {
        logger.error('Error processing Stripe refund:', stripeError);
        throw new AppError('Failed to process refund with Stripe', 500, 'STRIPE_REFUND_ERROR');
      }
    }

    // Update payment status
    await db('payments')
      .where('id', payment.id)
      .update({
        status: 'refunded',
        refunded_at: new Date(),
        updated_at: new Date(),
      });

    // Update booking status
    await db('bookings')
      .where('id', payment.booking_id)
      .update({
        status: 'cancelled',
        updated_at: new Date(),
      });

    logger.info('Payment refunded successfully', { 
      paymentId: payment.id, 
      bookingId: payment.booking_id,
      userId,
      refundId: refund?.id
    });

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        paymentId: payment.id,
        status: 'refunded',
        refundId: refund?.id
      }
    });
  } catch (error) {
    logger.error('Error refunding payment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to refund payment', 500, 'PAYMENT_REFUND_ERROR');
  }
}));

// Webhook endpoint for Stripe events
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env['STRIPE_WEBHOOK_SECRET'];

    if (!sig || !endpointSecret) {
      throw new AppError('Missing webhook signature or secret', 400, 'WEBHOOK_SIGNATURE_MISSING');
    }

    let event: Stripe.Event;

    try {
      event = stripeService.verifyWebhookSignature(req.body, sig as string, endpointSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { err });
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'refund.created':
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db('payments')
      .where('stripe_payment_intent_id', paymentIntent.id)
      .where('is_active', true)
      .first();

    if (payment) {
      await db('payments')
        .where('id', payment.id)
        .update({
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date(),
        });

      await db('bookings')
        .where('id', payment.booking_id)
        .update({
          status: 'confirmed',
          updated_at: new Date(),
        });

      logger.info('Payment completed via webhook', { 
        paymentId: payment.id, 
        bookingId: payment.booking_id 
      });
    }
  } catch (error) {
    logger.error('Error handling payment success webhook:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db('payments')
      .where('stripe_payment_intent_id', paymentIntent.id)
      .where('is_active', true)
      .first();

    if (payment) {
      await db('payments')
        .where('id', payment.id)
        .update({
          status: 'failed',
          updated_at: new Date(),
        });

      logger.info('Payment failed via webhook', { 
        paymentId: payment.id, 
        bookingId: payment.booking_id 
      });
    }
  } catch (error) {
    logger.error('Error handling payment failure webhook:', error);
  }
}

async function handleRefundCreated(refund: Stripe.Refund) {
  try {
    const payment = await db('payments')
      .where('stripe_payment_intent_id', refund.payment_intent)
      .where('is_active', true)
      .first();

    if (payment) {
      await db('payments')
        .where('id', payment.id)
        .update({
          status: 'refunded',
          refunded_at: new Date(),
          updated_at: new Date(),
        });

      await db('bookings')
        .where('id', payment.booking_id)
        .update({
          status: 'cancelled',
          updated_at: new Date(),
        });

      logger.info('Payment refunded via webhook', { 
        paymentId: payment.id, 
        bookingId: payment.booking_id,
        refundId: refund.id
      });
    }
  } catch (error) {
    logger.error('Error handling refund created webhook:', error);
  }
}

export default router;

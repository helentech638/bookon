import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { tfcService } from '../services/tfcService';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

// Validation middleware
const validateTFCBooking = [
  body('bookingId').isUUID().withMessage('Valid booking ID is required'),
  body('amount').isDecimal().withMessage('Valid amount is required'),
  body('venueId').isUUID().withMessage('Valid venue ID is required'),
  body('holdPeriod').optional().isInt({ min: 1, max: 30 }).withMessage('Hold period must be between 1-30 days')
];

const validateBookingId = [
  param('id').isUUID().withMessage('Valid booking ID is required')
];

// Create TFC booking
router.post('/create', authenticateToken, validateTFCBooking, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const userId = req.user!.id;
    const { bookingId, amount, venueId, holdPeriod } = req.body;

    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        parentId: userId,
        status: 'pending'
      }
    });

    if (!booking) {
      throw new AppError('Booking not found or not eligible for TFC', 404, 'BOOKING_NOT_FOUND');
    }

    const tfcData = await tfcService.createTFCBooking({
      bookingId,
      amount,
      venueId,
      parentId: userId,
      holdPeriod
    });

    logger.info('TFC booking created via API', {
      userId,
      bookingId,
      reference: tfcData.reference
    });

    res.status(201).json({
      success: true,
      message: 'TFC booking created successfully',
      data: {
        reference: tfcData.reference,
        deadline: tfcData.deadline,
        instructions: tfcData.instructions
      }
    });
  } catch (error) {
    logger.error('Error creating TFC booking:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create TFC booking', 500, 'TFC_CREATE_ERROR');
  }
}));

// Get pending TFC bookings (admin only)
router.get('/pending', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'staff'].includes(user.role)) {
      throw new AppError('Admin or staff access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const { venueId } = req.query;
    const bookings = await tfcService.getPendingTFCBookings(venueId as string);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Error getting pending TFC bookings:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get pending TFC bookings', 500, 'TFC_FETCH_ERROR');
  }
}));

// Confirm TFC payment (admin only)
router.post('/confirm/:id', authenticateToken, validateBookingId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'staff'].includes(user.role)) {
      throw new AppError('Admin or staff access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const { id } = req.params;
    const adminId = user.id;

    await tfcService.confirmTFCPayment(id, adminId);

    logger.info('TFC payment confirmed via API', {
      adminId,
      bookingId: id
    });

    res.json({
      success: true,
      message: 'TFC payment confirmed successfully'
    });
  } catch (error) {
    logger.error('Error confirming TFC payment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to confirm TFC payment', 500, 'TFC_CONFIRM_ERROR');
  }
}));

// Cancel unpaid TFC booking (admin only)
router.post('/cancel/:id', authenticateToken, validateBookingId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'staff'].includes(user.role)) {
      throw new AppError('Admin or staff access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminId = user.id;

    await tfcService.cancelUnpaidTFCBooking(id, adminId, reason);

    logger.info('TFC booking cancelled via API', {
      adminId,
      bookingId: id,
      reason
    });

    res.json({
      success: true,
      message: 'TFC booking cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling TFC booking:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to cancel TFC booking', 500, 'TFC_CANCEL_ERROR');
  }
}));

// Bulk confirm TFC payments (admin only)
router.post('/bulk-confirm', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'staff'].includes(user.role)) {
      throw new AppError('Admin or staff access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const { bookingIds } = req.body;
    
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new AppError('Booking IDs array is required', 400, 'MISSING_BOOKING_IDS');
    }

    const adminId = user.id;
    const result = await tfcService.bulkConfirmTFCPayments(bookingIds, adminId);

    logger.info('Bulk TFC confirmation via API', {
      adminId,
      success: result.success,
      failed: result.failed
    });

    res.json({
      success: true,
      message: `Bulk confirmation completed: ${result.success} successful, ${result.failed} failed`,
      data: result
    });
  } catch (error) {
    logger.error('Error bulk confirming TFC payments:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to bulk confirm TFC payments', 500, 'TFC_BULK_CONFIRM_ERROR');
  }
}));

// Process expired TFC bookings (admin/system only)
router.post('/process-expired', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    if (!['admin', 'staff'].includes(user.role)) {
      throw new AppError('Admin or staff access required', 403, 'ADMIN_ACCESS_REQUIRED');
    }

    const cancelledCount = await tfcService.processExpiredTFCBookings();

    logger.info('Expired TFC bookings processed via API', {
      adminId: user.id,
      cancelledCount
    });

    res.json({
      success: true,
      message: `Processed ${cancelledCount} expired TFC bookings`,
      data: { cancelledCount }
    });
  } catch (error) {
    logger.error('Error processing expired TFC bookings:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to process expired TFC bookings', 500, 'TFC_PROCESS_EXPIRED_ERROR');
  }
}));

// Get TFC booking details
router.get('/booking/:id', authenticateToken, validateBookingId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        parentId: userId
      },
      include: {
        activity: {
          include: {
            venue: true
          }
        },
        child: true
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.paymentMethod !== 'tfc') {
      throw new AppError('Booking is not a TFC payment', 400, 'NOT_TFC_BOOKING');
    }

    const daysRemaining = booking.tfcDeadline ? 
      Math.ceil((booking.tfcDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      success: true,
      data: {
        id: booking.id,
        reference: booking.tfcReference,
        deadline: booking.tfcDeadline,
        instructions: booking.tfcInstructions,
        amount: booking.amount,
        status: booking.paymentStatus,
        daysRemaining,
        activity: booking.activity.name,
        venue: booking.activity.venue.name,
        child: `${booking.child.firstName} ${booking.child.lastName}`,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    logger.error('Error getting TFC booking details:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get TFC booking details', 500, 'TFC_BOOKING_DETAILS_ERROR');
  }
}));

// Mark TFC booking as part-paid
router.post('/part-paid/:id', authenticateToken, validateBookingId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const { amountReceived } = req.body;
    const adminId = req.user!.id;

    if (!amountReceived || isNaN(parseFloat(amountReceived))) {
      throw new AppError('Valid amount received is required', 400, 'INVALID_AMOUNT');
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        activity: true,
        child: true,
        parent: true
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.paymentMethod !== 'tfc') {
      throw new AppError('Booking is not a TFC payment', 400, 'NOT_TFC_BOOKING');
    }

    if (booking.status !== 'pending') {
      throw new AppError('Only pending bookings can be marked as part-paid', 400, 'INVALID_BOOKING_STATUS');
    }

    // Update booking with part-paid status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'part_paid',
        paymentStatus: 'part_paid',
        notes: `${booking.notes || ''}\n[${new Date().toISOString()}] Marked as part-paid: £${amountReceived} received by admin ${adminId}`
      }
    });

    logger.info('TFC booking marked as part-paid', {
      bookingId: id,
      amountReceived: parseFloat(amountReceived),
      adminId,
      totalAmount: booking.amount
    });

    res.json({
      success: true,
      message: 'Booking marked as part-paid successfully',
      data: {
        bookingId: id,
        amountReceived: parseFloat(amountReceived),
        remainingAmount: booking.amount - parseFloat(amountReceived)
      }
    });
  } catch (error) {
    logger.error('Error marking TFC booking as part-paid:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to mark booking as part-paid', 500, 'PART_PAID_ERROR');
  }
}));

// Convert TFC booking to wallet credit
router.post('/convert-to-credit/:id', authenticateToken, validateBookingId, asyncHandler(async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params;
    const adminId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        activity: true,
        child: true,
        parent: true
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.paymentMethod !== 'tfc') {
      throw new AppError('Booking is not a TFC payment', 400, 'NOT_TFC_BOOKING');
    }

    if (booking.status !== 'pending') {
      throw new AppError('Only pending bookings can be converted to credit', 400, 'INVALID_BOOKING_STATUS');
    }

    // Create wallet credit for the parent
    const walletCredit = await prisma.walletCredit.create({
      data: {
        parentId: booking.parentId,
        providerId: booking.activity.venueId,
        amount: booking.amount,
        type: 'refund',
        source: 'tfc_conversion',
        sourceId: booking.id,
        description: `Credit from TFC booking conversion - ${booking.activity.name}`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
        isActive: true
      }
    });

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        paymentStatus: 'refunded',
        notes: `${booking.notes || ''}\n[${new Date().toISOString()}] Converted to wallet credit by admin ${adminId}. Credit ID: ${walletCredit.id}`
      }
    });

    logger.info('TFC booking converted to wallet credit', {
      bookingId: id,
      creditId: walletCredit.id,
      amount: booking.amount,
      adminId,
      parentId: booking.parentId
    });

    res.json({
      success: true,
      message: 'Booking converted to wallet credit successfully',
      data: {
        bookingId: id,
        creditId: walletCredit.id,
        creditAmount: booking.amount,
        parentId: booking.parentId
      }
    });
  } catch (error) {
    logger.error('Error converting TFC booking to credit:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to convert booking to credit', 500, 'CONVERT_TO_CREDIT_ERROR');
  }
}));

export default router;

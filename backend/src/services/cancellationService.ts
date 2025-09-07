import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface CancellationRequest {
  bookingId: string;
  parentId: string;
  reason: string;
  requestedAt: Date;
}

export interface CancellationResult {
  eligible: boolean;
  refundAmount: number;
  creditAmount: number;
  adminFee: number;
  method: 'cash' | 'credit' | 'mixed';
  reason: string;
  breakdown: {
    totalPaid: number;
    sessionsUsed: number;
    sessionsRemaining: number;
    valuePerSession: number;
    refundableAmount: number;
    creditAmount: number;
    adminFee: number;
  };
}

export interface ProRataCalculation {
  totalPaid: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  valuePerSession: number;
  refundableAmount: number;
  creditAmount: number;
  adminFee: number;
  breakdown: {
    cashRefund: number;
    creditRefund: number;
    fees: number;
  };
}

class CancellationService {
  private readonly ADMIN_FEE = 2.00; // £2 admin fee per cancellation

  /**
   * Calculate pro-rata refund for a booking
   */
  async calculateProRataRefund(bookingId: string, cancellationDate: Date): Promise<ProRataCalculation> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          activity: {
            include: {
              venue: true
            }
          },
          child: true,
          parent: true
        }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      const totalPaid = Number(booking.amount);
      const activityDate = new Date(booking.activityDate);
      const activityTime = booking.activityTime;
      
      // Calculate session details
      const sessionDateTime = new Date(`${activityDate.toISOString().split('T')[0]}T${activityTime}`);
      const hoursUntilSession = (sessionDateTime.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
      
      // For simplicity, assume each booking is for one session
      // In a real system, you'd calculate based on course duration, number of sessions, etc.
      const sessionsUsed = hoursUntilSession < 0 ? 1 : 0; // If session has passed, it's used
      const sessionsRemaining = 1 - sessionsUsed;
      const valuePerSession = totalPaid; // Assuming single session booking

      // Calculate refundable amounts
      const refundableAmount = sessionsRemaining * valuePerSession;
      const creditAmount = refundableAmount - this.ADMIN_FEE;
      const cashRefund = 0; // Default to credit only
      const creditRefund = Math.max(0, creditAmount);

      return {
        totalPaid,
        sessionsUsed,
        sessionsRemaining,
        valuePerSession,
        refundableAmount,
        creditAmount: creditRefund,
        adminFee: this.ADMIN_FEE,
        breakdown: {
          cashRefund,
          creditRefund,
          fees: this.ADMIN_FEE
        }
      };
    } catch (error) {
      logger.error('Error calculating pro-rata refund:', error);
      throw error;
    }
  }

  /**
   * Determine cancellation eligibility and method
   */
  async determineCancellationEligibility(bookingId: string, cancellationDate: Date): Promise<CancellationResult> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          activity: true,
          parent: true
        }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      const activityDate = new Date(booking.activityDate);
      const activityTime = booking.activityTime;
      const sessionDateTime = new Date(`${activityDate.toISOString().split('T')[0]}T${activityTime}`);
      const hoursUntilSession = (sessionDateTime.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);

      // Check if cancellation is eligible
      const isEligible = hoursUntilSession >= 24; // Must be 24+ hours before session
      const isPastSession = hoursUntilSession < 0;
      const isWithin24Hours = hoursUntilSession < 24 && hoursUntilSession >= 0;

      if (isPastSession) {
        return {
          eligible: false,
          refundAmount: 0,
          creditAmount: 0,
          adminFee: 0,
          method: 'credit',
          reason: 'Session has already occurred - no refund available',
          breakdown: {
            totalPaid: Number(booking.amount),
            sessionsUsed: 1,
            sessionsRemaining: 0,
            valuePerSession: Number(booking.amount),
            refundableAmount: 0,
            creditAmount: 0,
            adminFee: 0
          }
        };
      }

      if (isWithin24Hours) {
        return {
          eligible: false,
          refundAmount: 0,
          creditAmount: 0,
          adminFee: 0,
          method: 'credit',
          reason: 'Cancellation must be made at least 24 hours before the session',
          breakdown: {
            totalPaid: Number(booking.amount),
            sessionsUsed: 0,
            sessionsRemaining: 1,
            valuePerSession: Number(booking.amount),
            refundableAmount: Number(booking.amount),
            creditAmount: 0,
            adminFee: 0
          }
        };
      }

      // Calculate refund amounts
      const calculation = await this.calculateProRataRefund(bookingId, cancellationDate);
      
      // Determine refund method based on payment method
      let method: 'cash' | 'credit' | 'mixed' = 'credit';
      let refundAmount = 0;
      let creditAmount = calculation.creditAmount;

      if (booking.paymentMethod === 'card') {
        method = 'cash';
        refundAmount = calculation.refundableAmount - this.ADMIN_FEE;
        creditAmount = 0;
      } else if (booking.paymentMethod === 'tfc' || booking.paymentMethod === 'voucher') {
        method = 'credit';
        refundAmount = 0;
        creditAmount = calculation.refundableAmount - this.ADMIN_FEE;
      } else if (booking.paymentMethod === 'mixed') {
        method = 'mixed';
        // For mixed payments, refund card portion as cash, TFC portion as credit
        refundAmount = calculation.refundableAmount * 0.5 - this.ADMIN_FEE; // Assume 50/50 split
        creditAmount = calculation.refundableAmount * 0.5 - this.ADMIN_FEE;
      }

      return {
        eligible: true,
        refundAmount: Math.max(0, refundAmount),
        creditAmount: Math.max(0, creditAmount),
        adminFee: this.ADMIN_FEE,
        method,
        reason: 'Cancellation eligible for refund',
        breakdown: calculation.breakdown
      };
    } catch (error) {
      logger.error('Error determining cancellation eligibility:', error);
      throw error;
    }
  }

  /**
   * Process cancellation request
   */
  async processCancellation(
    bookingId: string, 
    parentId: string, 
    reason: string, 
    adminId?: string
  ): Promise<{ refundTransactionId?: string; creditId?: string }> {
    try {
      const cancellationDate = new Date();
      const eligibility = await this.determineCancellationEligibility(bookingId, cancellationDate);

      if (!eligibility.eligible) {
        throw new AppError(eligibility.reason, 400, 'CANCELLATION_NOT_ELIGIBLE');
      }

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          notes: `Cancelled: ${reason}`,
          updatedAt: new Date()
        }
      });

      let refundTransactionId: string | undefined;
      let creditId: string | undefined;

      // Process refund if applicable
      if (eligibility.refundAmount > 0) {
        const refundTransaction = await prisma.refundTransaction.create({
          data: {
            bookingId,
            amount: eligibility.refundAmount,
            method: 'card',
            fee: eligibility.adminFee,
            reason: 'cancellation',
            status: 'pending',
            adminId: adminId || null,
            auditTrail: {
              requestedBy: parentId,
              requestedAt: cancellationDate,
              reason,
              calculation: eligibility.breakdown
            }
          }
        });
        refundTransactionId = refundTransaction.id;
      }

      // Process credit if applicable
      if (eligibility.creditAmount > 0) {
        const credit = await prisma.walletCredit.create({
          data: {
            parentId,
            providerId: null, // Will be set based on venue
            bookingId,
            amount: eligibility.creditAmount,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            source: 'cancellation',
            status: 'active',
            description: `Credit from cancellation of booking ${bookingId}`
          }
        });
        creditId = credit.id;
      }

      logger.info('Cancellation processed successfully', {
        bookingId,
        parentId,
        refundAmount: eligibility.refundAmount,
        creditAmount: eligibility.creditAmount,
        adminFee: eligibility.adminFee,
        refundTransactionId,
        creditId
      });

      return { refundTransactionId, creditId };
    } catch (error) {
      logger.error('Error processing cancellation:', error);
      throw error;
    }
  }

  /**
   * Process provider cancellation (no admin fee)
   */
  async processProviderCancellation(
    bookingId: string,
    adminId: string,
    reason: string,
    refundMethod: 'cash' | 'credit' | 'parent_choice' = 'parent_choice'
  ): Promise<{ refundTransactionId?: string; creditId?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { activity: true }
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      const totalAmount = Number(booking.amount);
      const cancellationDate = new Date();

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          notes: `Provider cancelled: ${reason}`,
          updatedAt: cancellationDate
        }
      });

      let refundTransactionId: string | undefined;
      let creditId: string | undefined;

      // Provider cancellations have no admin fee
      if (refundMethod === 'cash' || refundMethod === 'parent_choice') {
        const refundTransaction = await prisma.refundTransaction.create({
          data: {
            bookingId,
            amount: totalAmount,
            method: 'card',
            fee: 0, // No admin fee for provider cancellations
            reason: 'provider_cancelled',
            status: 'pending',
            adminId,
            auditTrail: {
              cancelledBy: adminId,
              cancelledAt: cancellationDate,
              reason,
              fullRefund: true
            }
          }
        });
        refundTransactionId = refundTransaction.id;
      }

      if (refundMethod === 'credit' || refundMethod === 'parent_choice') {
        const credit = await prisma.walletCredit.create({
          data: {
            parentId: booking.parentId,
            providerId: booking.activity.venueId,
            bookingId,
            amount: totalAmount,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            source: 'provider_cancellation',
            status: 'active',
            description: `Full credit from provider cancellation of booking ${bookingId}`
          }
        });
        creditId = credit.id;
      }

      logger.info('Provider cancellation processed successfully', {
        bookingId,
        adminId,
        refundAmount: refundMethod === 'cash' ? totalAmount : 0,
        creditAmount: refundMethod === 'credit' ? totalAmount : 0,
        refundTransactionId,
        creditId
      });

      return { refundTransactionId, creditId };
    } catch (error) {
      logger.error('Error processing provider cancellation:', error);
      throw error;
    }
  }

  /**
   * Get cancellation history for a booking
   */
  async getCancellationHistory(bookingId: string): Promise<any[]> {
    try {
      const refunds = await prisma.refundTransaction.findMany({
        where: { bookingId },
        include: {
          booking: {
            include: {
              activity: true,
              child: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return refunds.map(refund => ({
        id: refund.id,
        amount: refund.amount,
        method: refund.method,
        fee: refund.fee,
        reason: refund.reason,
        status: refund.status,
        processedAt: refund.processedAt,
        createdAt: refund.createdAt,
        auditTrail: refund.auditTrail
      }));
    } catch (error) {
      logger.error('Error getting cancellation history:', error);
      throw error;
    }
  }

  /**
   * Get cancellation statistics for admin dashboard
   */
  async getCancellationStats(venueId?: string): Promise<{
    totalCancellations: number;
    totalRefunds: number;
    totalCredits: number;
    totalFees: number;
    cancellationsByReason: Record<string, number>;
    cancellationsByMethod: Record<string, number>;
  }> {
    try {
      const whereClause: any = {};
      if (venueId) {
        whereClause.booking = {
          activity: {
            venueId: venueId
          }
        };
      }

      const refunds = await prisma.refundTransaction.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              activity: true
            }
          }
        }
      });

      const stats = {
        totalCancellations: refunds.length,
        totalRefunds: refunds.reduce((sum, r) => sum + Number(r.amount), 0),
        totalCredits: 0, // Would need to query wallet credits separately
        totalFees: refunds.reduce((sum, r) => sum + Number(r.fee), 0),
        cancellationsByReason: {} as Record<string, number>,
        cancellationsByMethod: {} as Record<string, number>
      };

      refunds.forEach(refund => {
        // Count by reason
        stats.cancellationsByReason[refund.reason] = 
          (stats.cancellationsByReason[refund.reason] || 0) + 1;
        
        // Count by method
        stats.cancellationsByMethod[refund.method] = 
          (stats.cancellationsByMethod[refund.method] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting cancellation stats:', error);
      throw error;
    }
  }
}

export const cancellationService = new CancellationService();

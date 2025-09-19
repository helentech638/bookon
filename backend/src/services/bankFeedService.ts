import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';
import { EmailService } from './emailService';
import { TFCService } from './tfcService';

export interface BankFeedTransactionData {
  bankReference: string;
  amount: number;
  currency: string;
  paymentReference?: string;
  description?: string;
  transactionDate: Date;
  bankAccount?: string;
  metadata?: any;
}

export interface BankFeedMatchResult {
  success: boolean;
  matchedBookingId?: string;
  message: string;
  bankTransactionId?: string;
}

export class BankFeedService {
  /**
   * Process incoming bank feed transaction
   */
  static async processBankTransaction(data: BankFeedTransactionData): Promise<BankFeedMatchResult> {
    try {
      logger.info('Processing bank feed transaction', {
        bankReference: data.bankReference,
        amount: data.amount,
        paymentReference: data.paymentReference
      });

      // Check if transaction already exists
      const existingTransaction = await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.findUnique({
          where: { bankReference: data.bankReference }
        });
      });

      if (existingTransaction) {
        logger.warn('Bank transaction already exists', { bankReference: data.bankReference });
        return {
          success: false,
          message: 'Transaction already processed',
          bankTransactionId: existingTransaction.id
        };
      }

      // Create bank feed transaction record
      const bankTransaction = await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.create({
          data: {
            bankReference: data.bankReference,
            amount: data.amount,
            currency: data.currency,
            paymentReference: data.paymentReference,
            description: data.description,
            transactionDate: data.transactionDate,
            bankAccount: data.bankAccount,
            metadata: data.metadata,
            status: 'pending'
          }
        });
      });

      // Attempt to match with TFC booking
      const matchResult = await this.attemptAutoMatch(bankTransaction.id);

      return {
        success: matchResult.success,
        matchedBookingId: matchResult.matchedBookingId,
        message: matchResult.message,
        bankTransactionId: bankTransaction.id
      };

    } catch (error) {
      logger.error('Error processing bank feed transaction:', error);
      throw error;
    }
  }

  /**
   * Attempt to auto-match bank transaction with TFC booking
   */
  static async attemptAutoMatch(bankTransactionId: string): Promise<BankFeedMatchResult> {
    try {
      const bankTransaction = await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.findUnique({
          where: { id: bankTransactionId }
        });
      });

      if (!bankTransaction) {
        return { success: false, message: 'Bank transaction not found' };
      }

      // If no payment reference, mark as unmatched
      if (!bankTransaction.paymentReference) {
        await safePrismaQuery(async (client) => {
          return await client.bankFeedTransaction.update({
            where: { id: bankTransactionId },
            data: { status: 'unmatched' }
          });
        });

        return { success: false, message: 'No payment reference found for matching' };
      }

      // Find matching TFC booking
      const matchingBooking = await safePrismaQuery(async (client) => {
        return await client.booking.findFirst({
          where: {
            tfcReference: bankTransaction.paymentReference,
            paymentMethod: 'tfc',
            paymentStatus: 'pending_payment',
            status: 'pending'
          },
          include: {
            parent: true,
            child: true,
            activity: {
              include: {
                venue: true
              }
            }
          }
        });
      });

      if (!matchingBooking) {
        await safePrismaQuery(async (client) => {
          return await client.bankFeedTransaction.update({
            where: { id: bankTransactionId },
            data: { status: 'unmatched' }
          });
        });

        return { success: false, message: 'No matching TFC booking found' };
      }

      // Verify amount matches (with small tolerance for bank fees)
      const amountDifference = Math.abs(Number(matchingBooking.amount) - Number(bankTransaction.amount));
      const tolerance = 0.01; // 1 penny tolerance

      if (amountDifference > tolerance) {
        await safePrismaQuery(async (client) => {
          return await client.bankFeedTransaction.update({
            where: { id: bankTransactionId },
            data: { status: 'unmatched' }
          });
        });

        return { 
          success: false, 
          message: `Amount mismatch: booking £${matchingBooking.amount}, bank £${bankTransaction.amount}` 
        };
      }

      // Match and confirm the booking
      await this.confirmTFCPayment(matchingBooking.id, bankTransactionId);

      return {
        success: true,
        matchedBookingId: matchingBooking.id,
        message: 'TFC payment automatically confirmed'
      };

    } catch (error) {
      logger.error('Error in auto-match process:', error);
      return { success: false, message: 'Auto-match failed due to error' };
    }
  }

  /**
   * Confirm TFC payment and update booking status
   */
  static async confirmTFCPayment(bookingId: string, bankTransactionId: string): Promise<void> {
    try {
      // Update booking status
      await safePrismaQuery(async (client) => {
        return await client.booking.update({
          where: { id: bookingId },
          data: {
            status: 'confirmed',
            paymentStatus: 'paid',
            notes: `TFC payment confirmed via bank feed on ${new Date().toISOString()}`
          }
        });
      });

      // Update bank transaction status
      await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.update({
          where: { id: bankTransactionId },
          data: {
            status: 'matched',
            matchedBookingId: bookingId,
            matchedAt: new Date(),
            processedAt: new Date()
          }
        });
      });

      // Send confirmation email
      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: true,
            child: true,
            activity: {
              include: {
                venue: true
              }
            }
          }
        });
      });

      if (booking) {
        try {
          await EmailService.sendTFCPaymentConfirmation(booking);
          logger.info('TFC payment confirmation email sent', { bookingId });
        } catch (emailError) {
          logger.error('Failed to send TFC confirmation email:', emailError);
        }
      }

      logger.info('TFC payment confirmed via bank feed', {
        bookingId,
        bankTransactionId,
        amount: booking?.amount
      });

    } catch (error) {
      logger.error('Error confirming TFC payment:', error);
      throw error;
    }
  }

  /**
   * Manual match bank transaction to booking
   */
  static async manualMatch(bankTransactionId: string, bookingId: string): Promise<BankFeedMatchResult> {
    try {
      const bankTransaction = await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.findUnique({
          where: { id: bankTransactionId }
        });
      });

      if (!bankTransaction) {
        return { success: false, message: 'Bank transaction not found' };
      }

      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: true,
            child: true,
            activity: {
              include: {
                venue: true
              }
            }
          }
        });
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (booking.paymentMethod !== 'tfc' || booking.paymentStatus !== 'pending_payment') {
        return { success: false, message: 'Booking is not a pending TFC payment' };
      }

      // Confirm the payment
      await this.confirmTFCPayment(bookingId, bankTransactionId);

      return {
        success: true,
        matchedBookingId: bookingId,
        message: 'TFC payment manually confirmed'
      };

    } catch (error) {
      logger.error('Error in manual match:', error);
      return { success: false, message: 'Manual match failed due to error' };
    }
  }

  /**
   * Get unmatched bank transactions for admin review
   */
  static async getUnmatchedTransactions(limit: number = 50): Promise<any[]> {
    try {
      const transactions = await safePrismaQuery(async (client) => {
        return await client.bankFeedTransaction.findMany({
          where: { status: 'unmatched' },
          orderBy: { transactionDate: 'desc' },
          take: limit
        });
      });

      return transactions;
    } catch (error) {
      logger.error('Error fetching unmatched transactions:', error);
      throw error;
    }
  }

  /**
   * Get pending TFC bookings for manual matching
   */
  static async getPendingTFCBookings(limit: number = 50): Promise<any[]> {
    try {
      const bookings = await safePrismaQuery(async (client) => {
        return await client.booking.findMany({
          where: {
            paymentMethod: 'tfc',
            paymentStatus: 'pending_payment',
            status: 'pending'
          },
          include: {
            parent: true,
            child: true,
            activity: {
              include: {
                venue: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });
      });

      return bookings;
    } catch (error) {
      logger.error('Error fetching pending TFC bookings:', error);
      throw error;
    }
  }

  /**
   * Get bank feed statistics
   */
  static async getBankFeedStats(): Promise<{
    totalTransactions: number;
    matchedTransactions: number;
    unmatchedTransactions: number;
    pendingTransactions: number;
    totalMatchedAmount: number;
    totalUnmatchedAmount: number;
  }> {
    try {
      const [total, matched, unmatched, pending, matchedAmount, unmatchedAmount] = await Promise.all([
        safePrismaQuery(async (client) => client.bankFeedTransaction.count()),
        safePrismaQuery(async (client) => client.bankFeedTransaction.count({ where: { status: 'matched' } })),
        safePrismaQuery(async (client) => client.bankFeedTransaction.count({ where: { status: 'unmatched' } })),
        safePrismaQuery(async (client) => client.bankFeedTransaction.count({ where: { status: 'pending' } })),
        safePrismaQuery(async (client) => {
          const result = await client.bankFeedTransaction.aggregate({
            where: { status: 'matched' },
            _sum: { amount: true }
          });
          return Number(result._sum.amount || 0);
        }),
        safePrismaQuery(async (client) => {
          const result = await client.bankFeedTransaction.aggregate({
            where: { status: 'unmatched' },
            _sum: { amount: true }
          });
          return Number(result._sum.amount || 0);
        })
      ]);

      return {
        totalTransactions: total,
        matchedTransactions: matched,
        unmatchedTransactions: unmatched,
        pendingTransactions: pending,
        totalMatchedAmount: matchedAmount,
        totalUnmatchedAmount: unmatchedAmount
      };
    } catch (error) {
      logger.error('Error fetching bank feed stats:', error);
      throw error;
    }
  }
}

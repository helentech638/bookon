import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { BankFeedService } from '../services/bankFeedService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Webhook endpoint for bank feed data
 * This would be called by bank feed providers (Open Banking, Yapily, etc.)
 */
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions)) {
      throw new AppError('Invalid webhook payload - expected transactions array', 400, 'INVALID_PAYLOAD');
    }

    logger.info(`Processing ${transactions.length} bank feed transactions`);

    const results = [];
    for (const transaction of transactions) {
      try {
        const result = await BankFeedService.processBankTransaction({
          bankReference: transaction.reference || transaction.id,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency || 'GBP',
          paymentReference: transaction.description ? 
            extractPaymentReference(transaction.description) : undefined,
          description: transaction.description,
          transactionDate: new Date(transaction.date),
          bankAccount: transaction.account,
          metadata: transaction
        });

        results.push({
          bankReference: transaction.reference || transaction.id,
          success: result.success,
          message: result.message,
          matchedBookingId: result.matchedBookingId
        });

      } catch (error) {
        logger.error('Error processing individual bank transaction:', error);
        results.push({
          bankReference: transaction.reference || transaction.id,
          success: false,
          message: 'Processing failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bank feed transactions processed',
      results
    });

  } catch (error) {
    logger.error('Bank feed webhook processing error:', error);
    throw new AppError('Bank feed processing failed', 500, 'BANK_FEED_ERROR');
  }
}));

/**
 * Manual bank transaction upload (for testing/admin use)
 */
router.post('/upload', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions)) {
      throw new AppError('Invalid payload - expected transactions array', 400, 'INVALID_PAYLOAD');
    }

    const results = [];
    for (const transaction of transactions) {
      try {
        const result = await BankFeedService.processBankTransaction({
          bankReference: transaction.bankReference,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency || 'GBP',
          paymentReference: transaction.paymentReference,
          description: transaction.description,
          transactionDate: new Date(transaction.transactionDate),
          bankAccount: transaction.bankAccount,
          metadata: transaction.metadata
        });

        results.push(result);
      } catch (error) {
        logger.error('Error processing uploaded transaction:', error);
        results.push({
          success: false,
          message: 'Processing failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Transactions uploaded and processed',
      results
    });

  } catch (error) {
    logger.error('Bank feed upload error:', error);
    throw error;
  }
}));

/**
 * Get unmatched bank transactions for admin review
 */
router.get('/unmatched', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await BankFeedService.getUnmatchedTransactions(limit);

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    logger.error('Error fetching unmatched transactions:', error);
    throw error;
  }
}));

/**
 * Get pending TFC bookings for manual matching
 */
router.get('/pending-tfc', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const bookings = await BankFeedService.getPendingTFCBookings(limit);

    res.status(200).json({
      success: true,
      data: bookings
    });

  } catch (error) {
    logger.error('Error fetching pending TFC bookings:', error);
    throw error;
  }
}));

/**
 * Manual match bank transaction to booking
 */
router.post('/match/:bankTransactionId/:bookingId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { bankTransactionId, bookingId } = req.params;
    
    const result = await BankFeedService.manualMatch(bankTransactionId, bookingId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          bankTransactionId,
          matchedBookingId: result.matchedBookingId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    logger.error('Error in manual match:', error);
    throw error;
  }
}));

/**
 * Get bank feed statistics
 */
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await BankFeedService.getBankFeedStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching bank feed stats:', error);
    throw error;
  }
}));

/**
 * Extract payment reference from transaction description
 * Looks for patterns like "TFC-20240101-123456" or "Payment ref: TFC-20240101-123456"
 */
function extractPaymentReference(description: string): string | undefined {
  if (!description) return undefined;

  // Look for TFC reference pattern
  const tfcPattern = /TFC-\d{8}-\d{6}/g;
  const match = description.match(tfcPattern);
  
  if (match) {
    return match[0];
  }

  // Look for other payment reference patterns
  const refPattern = /(?:ref|reference|payment ref)[\s:]*([A-Z0-9-]+)/gi;
  const refMatch = description.match(refPattern);
  
  if (refMatch) {
    return refMatch[1];
  }

  return undefined;
}

export default router;

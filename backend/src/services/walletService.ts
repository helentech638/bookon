import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface WalletCredit {
  id: string;
  parentId: string;
  providerId?: string;
  bookingId?: string;
  amount: number;
  usedAmount: number;
  expiryDate: Date;
  source: string;
  status: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;
  transactionId?: string;
}

export interface CreditUsage {
  creditId: string;
  amount: number;
  bookingId: string;
  transactionId: string;
}

export interface WalletBalance {
  totalCredits: number;
  availableCredits: number;
  usedCredits: number;
  expiredCredits: number;
  creditsByProvider: Record<string, number>;
  credits: WalletCredit[];
}

class WalletService {
  /**
   * Get wallet balance for a parent
   */
  async getWalletBalance(parentId: string, providerId?: string): Promise<WalletBalance> {
    try {
      const whereClause: any = {
        parentId,
        status: 'active'
      };

      if (providerId) {
        whereClause.providerId = providerId;
      }

      const credits = await prisma.walletCredit.findMany({
        where: whereClause,
        orderBy: { expiryDate: 'asc' }
      });

      const now = new Date();
      const activeCredits = credits.filter(credit => credit.expiryDate > now);
      const expiredCredits = credits.filter(credit => credit.expiryDate <= now);

      const totalCredits = credits.reduce((sum, credit) => sum + Number(credit.amount), 0);
      const usedCredits = credits.reduce((sum, credit) => sum + Number(credit.usedAmount), 0);
      const availableCredits = activeCredits.reduce((sum, credit) => 
        sum + Number(credit.amount) - Number(credit.usedAmount), 0
      );
      const expiredCreditsAmount = expiredCredits.reduce((sum, credit) => 
        sum + Number(credit.amount) - Number(credit.usedAmount), 0
      );

      // Group credits by provider
      const creditsByProvider: Record<string, number> = {};
      activeCredits.forEach(credit => {
        const provider = credit.providerId || 'general';
        creditsByProvider[provider] = (creditsByProvider[provider] || 0) + 
          (Number(credit.amount) - Number(credit.usedAmount));
      });

      return {
        totalCredits,
        availableCredits,
        usedCredits,
        expiredCredits: expiredCreditsAmount,
        creditsByProvider,
        credits: activeCredits
      };
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Use credits for a booking
   */
  async useCredits(parentId: string, amount: number, bookingId: string, transactionId: string): Promise<CreditUsage[]> {
    try {
      const balance = await this.getWalletBalance(parentId);
      
      if (balance.availableCredits < amount) {
        throw new AppError('Insufficient credits available', 400, 'INSUFFICIENT_CREDITS');
      }

      const creditsToUse = balance.credits.filter(credit => 
        Number(credit.amount) - Number(credit.usedAmount) > 0
      );

      const usage: CreditUsage[] = [];
      let remainingAmount = amount;

      for (const credit of creditsToUse) {
        if (remainingAmount <= 0) break;

        const availableAmount = Number(credit.amount) - Number(credit.usedAmount);
        const useAmount = Math.min(availableAmount, remainingAmount);

        // Update credit usage
        await prisma.walletCredit.update({
          where: { id: credit.id },
          data: {
            usedAmount: Number(credit.usedAmount) + useAmount,
            usedAt: new Date(),
            transactionId,
            updatedAt: new Date()
          }
        });

        usage.push({
          creditId: credit.id,
          amount: useAmount,
          bookingId,
          transactionId
        });

        remainingAmount -= useAmount;
      }

      if (remainingAmount > 0) {
        throw new AppError('Failed to use all requested credits', 500, 'CREDIT_USAGE_ERROR');
      }

      logger.info('Credits used successfully', {
        parentId,
        amount,
        bookingId,
        transactionId,
        creditsUsed: usage.length
      });

      return usage;
    } catch (error) {
      logger.error('Error using credits:', error);
      throw error;
    }
  }

  /**
   * Issue new credit
   */
  async issueCredit(
    parentId: string,
    amount: number,
    source: string,
    providerId?: string,
    bookingId?: string,
    description?: string,
    expiryMonths: number = 12
  ): Promise<WalletCredit> {
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      const credit = await prisma.walletCredit.create({
        data: {
          parentId,
          providerId,
          bookingId,
          amount,
          usedAmount: 0,
          expiryDate,
          source,
          status: 'active',
          description: description || `Credit from ${source}`
        }
      });

      logger.info('Credit issued successfully', {
        parentId,
        amount,
        source,
        providerId,
        bookingId,
        creditId: credit.id
      });

      return credit;
    } catch (error) {
      logger.error('Error issuing credit:', error);
      throw error;
    }
  }

  /**
   * Transfer credits between providers
   */
  async transferCredits(
    parentId: string,
    fromProviderId: string,
    toProviderId: string,
    amount: number
  ): Promise<{ fromCredit: WalletCredit; toCredit: WalletCredit }> {
    try {
      const balance = await this.getWalletBalance(parentId, fromProviderId);
      
      if (balance.availableCredits < amount) {
        throw new AppError('Insufficient credits for transfer', 400, 'INSUFFICIENT_CREDITS');
      }

      // Use credits from source provider
      const usage = await this.useCredits(parentId, amount, 'transfer', `transfer-${Date.now()}`);
      
      // Issue credits to destination provider
      const toCredit = await this.issueCredit(
        parentId,
        amount,
        'transfer',
        toProviderId,
        undefined,
        `Transfer from ${fromProviderId}`,
        12
      );

      const fromCredit = await prisma.walletCredit.findUnique({
        where: { id: usage[0].creditId }
      });

      logger.info('Credits transferred successfully', {
        parentId,
        fromProviderId,
        toProviderId,
        amount,
        fromCreditId: fromCredit?.id,
        toCreditId: toCredit.id
      });

      return { fromCredit: fromCredit!, toCredit };
    } catch (error) {
      logger.error('Error transferring credits:', error);
      throw error;
    }
  }

  /**
   * Get credits expiring soon
   */
  async getExpiringCredits(daysAhead: number = 30): Promise<WalletCredit[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysAhead);

      const credits = await prisma.walletCredit.findMany({
        where: {
          status: 'active',
          expiryDate: {
            lte: expiryDate,
            gte: new Date()
          },
          usedAmount: {
            lt: prisma.walletCredit.fields.amount
          }
        },
        include: {
          parent: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { expiryDate: 'asc' }
      });

      return credits;
    } catch (error) {
      logger.error('Error getting expiring credits:', error);
      throw error;
    }
  }

  /**
   * Process expired credits
   */
  async processExpiredCredits(): Promise<number> {
    try {
      const now = new Date();
      
      const expiredCredits = await prisma.walletCredit.updateMany({
        where: {
          status: 'active',
          expiryDate: {
            lt: now
          }
        },
        data: {
          status: 'expired',
          updatedAt: now
        }
      });

      if (expiredCredits.count > 0) {
        logger.info(`Processed ${expiredCredits.count} expired credits`);
      }

      return expiredCredits.count;
    } catch (error) {
      logger.error('Error processing expired credits:', error);
      throw error;
    }
  }

  /**
   * Get credit history for a parent
   */
  async getCreditHistory(parentId: string, limit: number = 50): Promise<WalletCredit[]> {
    try {
      const credits = await prisma.walletCredit.findMany({
        where: { parentId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return credits;
    } catch (error) {
      logger.error('Error getting credit history:', error);
      throw error;
    }
  }

  /**
   * Get wallet statistics for admin
   */
  async getWalletStats(providerId?: string): Promise<{
    totalCreditsIssued: number;
    totalCreditsUsed: number;
    totalCreditsExpired: number;
    activeCredits: number;
    creditsBySource: Record<string, number>;
    creditsByProvider: Record<string, number>;
  }> {
    try {
      const whereClause: any = {};
      if (providerId) {
        whereClause.providerId = providerId;
      }

      const credits = await prisma.walletCredit.findMany({
        where: whereClause
      });

      const stats = {
        totalCreditsIssued: credits.reduce((sum, c) => sum + Number(c.amount), 0),
        totalCreditsUsed: credits.reduce((sum, c) => sum + Number(c.usedAmount), 0),
        totalCreditsExpired: 0,
        activeCredits: 0,
        creditsBySource: {} as Record<string, number>,
        creditsByProvider: {} as Record<string, number>
      };

      const now = new Date();
      
      credits.forEach(credit => {
        // Count by source
        stats.creditsBySource[credit.source] = 
          (stats.creditsBySource[credit.source] || 0) + Number(credit.amount);
        
        // Count by provider
        const provider = credit.providerId || 'general';
        stats.creditsByProvider[provider] = 
          (stats.creditsByProvider[provider] || 0) + Number(credit.amount);
        
        // Count active vs expired
        if (credit.expiryDate > now && credit.status === 'active') {
          stats.activeCredits += Number(credit.amount) - Number(credit.usedAmount);
        } else if (credit.expiryDate <= now || credit.status === 'expired') {
          stats.totalCreditsExpired += Number(credit.amount) - Number(credit.usedAmount);
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting wallet stats:', error);
      throw error;
    }
  }
}

export const walletService = new WalletService();

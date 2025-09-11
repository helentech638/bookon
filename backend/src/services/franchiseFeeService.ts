import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FranchiseFeeConfig {
  id: string;
  businessAccountId: string;
  franchiseFeeType: 'percent' | 'fixed';
  franchiseFeeValue: number;
  vatMode: 'inclusive' | 'exclusive';
  adminFeeAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueFranchiseFeeOverride {
  venueId: string;
  inheritFranchiseFee: boolean;
  franchiseFeeType?: 'percent' | 'fixed';
  franchiseFeeValue?: number;
}

export class FranchiseFeeService {
  /**
   * Get franchise fee configuration for a business account
   */
  static async getFranchiseFeeConfig(businessAccountId: string): Promise<FranchiseFeeConfig | null> {
    try {
      const businessAccount = await prisma.businessAccount.findUnique({
        where: { id: businessAccountId },
        select: {
          id: true,
          franchiseFeeType: true,
          franchiseFeeValue: true,
          vatMode: true,
          adminFeeAmount: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!businessAccount) {
        return null;
      }

      return {
        id: businessAccount.id,
        businessAccountId: businessAccount.id,
        franchiseFeeType: businessAccount.franchiseFeeType as 'percent' | 'fixed',
        franchiseFeeValue: Number(businessAccount.franchiseFeeValue),
        vatMode: businessAccount.vatMode as 'inclusive' | 'exclusive',
        adminFeeAmount: businessAccount.adminFeeAmount ? Number(businessAccount.adminFeeAmount) : undefined,
        isActive: businessAccount.isActive,
        createdAt: businessAccount.createdAt,
        updatedAt: businessAccount.updatedAt,
      };
    } catch (error) {
      console.error('Error getting franchise fee config:', error);
      throw new Error('Failed to get franchise fee configuration');
    }
  }

  /**
   * Update franchise fee configuration for a business account
   */
  static async updateFranchiseFeeConfig(
    businessAccountId: string,
    config: {
      franchiseFeeType: 'percent' | 'fixed';
      franchiseFeeValue: number;
      vatMode: 'inclusive' | 'exclusive';
      adminFeeAmount?: number;
    }
  ): Promise<FranchiseFeeConfig> {
    try {
      const updatedAccount = await prisma.businessAccount.update({
        where: { id: businessAccountId },
        data: {
          franchiseFeeType: config.franchiseFeeType,
          franchiseFeeValue: config.franchiseFeeValue,
          vatMode: config.vatMode,
          adminFeeAmount: config.adminFeeAmount,
          updatedAt: new Date(),
        },
      });

      return {
        id: updatedAccount.id,
        businessAccountId: updatedAccount.id,
        franchiseFeeType: updatedAccount.franchiseFeeType as 'percent' | 'fixed',
        franchiseFeeValue: Number(updatedAccount.franchiseFeeValue),
        vatMode: updatedAccount.vatMode as 'inclusive' | 'exclusive',
        adminFeeAmount: updatedAccount.adminFeeAmount ? Number(updatedAccount.adminFeeAmount) : undefined,
        isActive: updatedAccount.isActive,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      };
    } catch (error) {
      console.error('Error updating franchise fee config:', error);
      throw new Error('Failed to update franchise fee configuration');
    }
  }

  /**
   * Get venue franchise fee override
   */
  static async getVenueFranchiseFeeOverride(venueId: string): Promise<VenueFranchiseFeeOverride | null> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: {
          id: true,
          inheritFranchiseFee: true,
          franchiseFeeType: true,
          franchiseFeeValue: true,
        },
      });

      if (!venue) {
        return null;
      }

      return {
        venueId: venue.id,
        inheritFranchiseFee: venue.inheritFranchiseFee,
        franchiseFeeType: venue.franchiseFeeType as 'percent' | 'fixed' | undefined,
        franchiseFeeValue: venue.franchiseFeeValue ? Number(venue.franchiseFeeValue) : undefined,
      };
    } catch (error) {
      console.error('Error getting venue franchise fee override:', error);
      throw new Error('Failed to get venue franchise fee override');
    }
  }

  /**
   * Update venue franchise fee override
   */
  static async updateVenueFranchiseFeeOverride(
    venueId: string,
    override: {
      inheritFranchiseFee: boolean;
      franchiseFeeType?: 'percent' | 'fixed';
      franchiseFeeValue?: number;
    }
  ): Promise<VenueFranchiseFeeOverride> {
    try {
      const updatedVenue = await prisma.venue.update({
        where: { id: venueId },
        data: {
          inheritFranchiseFee: override.inheritFranchiseFee,
          franchiseFeeType: override.franchiseFeeType,
          franchiseFeeValue: override.franchiseFeeValue,
          updatedAt: new Date(),
        },
      });

      return {
        venueId: updatedVenue.id,
        inheritFranchiseFee: updatedVenue.inheritFranchiseFee,
        franchiseFeeType: updatedVenue.franchiseFeeType as 'percent' | 'fixed' | undefined,
        franchiseFeeValue: updatedVenue.franchiseFeeValue ? Number(updatedVenue.franchiseFeeValue) : undefined,
      };
    } catch (error) {
      console.error('Error updating venue franchise fee override:', error);
      throw new Error('Failed to update venue franchise fee override');
    }
  }

  /**
   * Calculate effective franchise fee for a venue
   */
  static async calculateEffectiveFranchiseFee(
    venueId: string,
    amount: number
  ): Promise<{
    franchiseFeeType: 'percent' | 'fixed';
    franchiseFeeValue: number;
    vatMode: 'inclusive' | 'exclusive';
    adminFeeAmount?: number;
    calculatedFee: number;
    breakdown: {
      grossAmount: number;
      franchiseFee: number;
      vatAmount: number;
      adminFee: number;
      netAmount: number;
    };
  }> {
    try {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          businessAccount: true,
        },
      });

      if (!venue || !venue.businessAccount) {
        throw new Error('Venue or business account not found');
      }

      let franchiseFeeType: 'percent' | 'fixed';
      let franchiseFeeValue: number;
      let vatMode: 'inclusive' | 'exclusive';
      let adminFeeAmount: number | undefined;

      if (venue.inheritFranchiseFee) {
        // Use business account settings
        franchiseFeeType = venue.businessAccount.franchiseFeeType as 'percent' | 'fixed';
        franchiseFeeValue = Number(venue.businessAccount.franchiseFeeValue);
        vatMode = venue.businessAccount.vatMode as 'inclusive' | 'exclusive';
        adminFeeAmount = venue.businessAccount.adminFeeAmount ? Number(venue.businessAccount.adminFeeAmount) : undefined;
      } else {
        // Use venue override settings
        franchiseFeeType = venue.franchiseFeeType as 'percent' | 'fixed';
        franchiseFeeValue = Number(venue.franchiseFeeValue || 0);
        vatMode = venue.businessAccount.vatMode as 'inclusive' | 'exclusive'; // VAT mode always from business account
        adminFeeAmount = venue.businessAccount.adminFeeAmount ? Number(venue.businessAccount.adminFeeAmount) : undefined;
      }

      // Calculate franchise fee
      let franchiseFee = 0;
      if (franchiseFeeType === 'percent') {
        franchiseFee = Math.round((amount * franchiseFeeValue) / 100);
      } else {
        franchiseFee = franchiseFeeValue;
      }

      // Calculate VAT (20% UK rate)
      const vatRate = 0.20;
      let vatAmount = 0;
      let netFranchiseFee = 0;

      if (vatMode === 'inclusive') {
        // VAT is included in the franchise fee
        vatAmount = Math.round(franchiseFee * vatRate / (1 + vatRate));
        netFranchiseFee = franchiseFee - vatAmount;
      } else {
        // VAT is added on top of the franchise fee
        vatAmount = Math.round(franchiseFee * vatRate);
        netFranchiseFee = franchiseFee;
      }

      const adminFee = adminFeeAmount || 0;
      const netAmount = amount - franchiseFee - adminFee;

      return {
        franchiseFeeType,
        franchiseFeeValue,
        vatMode,
        adminFeeAmount,
        calculatedFee: franchiseFee,
        breakdown: {
          grossAmount: amount,
          franchiseFee: franchiseFee,
          vatAmount: vatAmount,
          adminFee: adminFee,
          netAmount: netAmount,
        },
      };
    } catch (error) {
      console.error('Error calculating effective franchise fee:', error);
      throw new Error('Failed to calculate effective franchise fee');
    }
  }

  /**
   * Get all franchise fee configurations
   */
  static async getAllFranchiseFeeConfigs(): Promise<FranchiseFeeConfig[]> {
    try {
      const businessAccounts = await prisma.businessAccount.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          franchiseFeeType: true,
          franchiseFeeValue: true,
          vatMode: true,
          adminFeeAmount: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return businessAccounts.map(account => ({
        id: account.id,
        businessAccountId: account.id,
        franchiseFeeType: account.franchiseFeeType as 'percent' | 'fixed',
        franchiseFeeValue: Number(account.franchiseFeeValue),
        vatMode: account.vatMode as 'inclusive' | 'exclusive',
        adminFeeAmount: account.adminFeeAmount ? Number(account.adminFeeAmount) : undefined,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting all franchise fee configs:', error);
      throw new Error('Failed to get franchise fee configurations');
    }
  }
}

export default FranchiseFeeService;

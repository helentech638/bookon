import { TFCDeadlineService } from '../services/tfcDeadlineService';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

/**
 * Cron job to check TFC deadlines and send reminders
 * This should be run every hour or every few hours
 */
export async function runTFCDeadlineChecks() {
  try {
    logger.info('Starting TFC deadline checks...');
    
    await TFCDeadlineService.checkDeadlinesAndSendReminders();
    
    logger.info('TFC deadline checks completed successfully');
  } catch (error) {
    logger.error('TFC deadline checks failed:', error);
    throw error;
  }
}

/**
 * Cron job to check for credit expiry reminders
 * This should be run daily
 */
export async function runCreditExpiryChecks() {
  try {
    logger.info('Starting credit expiry checks...');
    
    // Get credits expiring in the next 7 days
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 7);
    
    const expiringCredits = await prisma.walletCredit.findMany({
      where: {
        status: 'active',
        expiryDate: {
          lte: expiryThreshold,
          gte: new Date()
        }
      },
      include: {
        parent: true
      }
    });

    logger.info(`Found ${expiringCredits.length} credits expiring soon`);

    // Send reminders for each expiring credit
    for (const credit of expiringCredits) {
      try {
        const { EmailService } = await import('../services/emailService');
        await EmailService.sendCreditExpiryReminder(
          credit.parentId,
          Number(credit.amount),
          credit.expiryDate
        );
        logger.info(`Sent credit expiry reminder for parent ${credit.parentId}`);
      } catch (error) {
        logger.error(`Failed to send credit expiry reminder for parent ${credit.parentId}:`, error);
      }
    }

    logger.info('Credit expiry checks completed successfully');
  } catch (error) {
    logger.error('Credit expiry checks failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'tfc-deadlines':
      runTFCDeadlineChecks()
        .then(() => {
          logger.info('TFC deadline cron job completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('TFC deadline cron job failed:', error);
          process.exit(1);
        });
      break;
      
    case 'credit-expiry':
      runCreditExpiryChecks()
        .then(() => {
          logger.info('Credit expiry cron job completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Credit expiry cron job failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      logger.error('Unknown command. Use: tfc-deadlines or credit-expiry');
      process.exit(1);
  }
}

import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

interface EmailContext {
  parentId: string;
  parentName: string;
  parentEmail: string;
  childName?: string;
  activityName?: string;
  venueName?: string;
  bookingDate?: string;
  bookingTime?: string;
  price?: number;
  bookingReference?: string;
  cancellationPolicy?: string;
  contactInfo?: string;
}

class AutomatedEmailService {
  async sendBookingConfirmation(bookingId: string): Promise<void> {
    try {
      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: { select: { firstName: true, lastName: true, email: true } },
            child: { select: { firstName: true, lastName: true } },
            activity: { 
              select: { 
                title: true, 
                startDate: true, 
                startTime: true, 
                price: true,
                venue: { select: { name: true, address: true } }
              } 
            }
          }
        });
      });

      if (!booking) {
        logger.warn(`Booking not found: ${bookingId}`);
        return;
      }

      const context: EmailContext = {
        parentId: booking.parentId,
        parentName: `${booking.parent.firstName} ${booking.parent.lastName}`,
        parentEmail: booking.parent.email,
        childName: `${booking.child.firstName} ${booking.child.lastName}`,
        activityName: booking.activity.title,
        venueName: booking.activity.venue.name,
        bookingDate: booking.activity.startDate.toISOString().split('T')[0],
        bookingTime: booking.activity.startTime,
        price: parseFloat(booking.activity.price.toString()),
        bookingReference: booking.id,
        cancellationPolicy: '24 hours notice required for cancellations',
        contactInfo: 'Contact us at support@bookon.com or call 0800 123 456'
      };

      await this.sendTemplateEmail('booking_confirmation', context);
      
      logger.info('Booking confirmation email sent', {
        bookingId,
        parentEmail: context.parentEmail
      });
    } catch (error) {
      logger.error('Failed to send booking confirmation email:', error);
    }
  }

  async sendBookingReminder(bookingId: string): Promise<void> {
    try {
      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: { select: { firstName: true, lastName: true, email: true } },
            child: { select: { firstName: true, lastName: true } },
            activity: { 
              select: { 
                title: true, 
                startDate: true, 
                startTime: true, 
                price: true,
                venue: { select: { name: true, address: true } }
              } 
            }
          }
        });
      });

      if (!booking) {
        logger.warn(`Booking not found: ${bookingId}`);
        return;
      }

      const context: EmailContext = {
        parentId: booking.parentId,
        parentName: `${booking.parent.firstName} ${booking.parent.lastName}`,
        parentEmail: booking.parent.email,
        childName: `${booking.child.firstName} ${booking.child.lastName}`,
        activityName: booking.activity.title,
        venueName: booking.activity.venue.name,
        bookingDate: booking.activity.startDate.toISOString().split('T')[0],
        bookingTime: booking.activity.startTime,
        price: parseFloat(booking.activity.price.toString()),
        bookingReference: booking.id,
        cancellationPolicy: '24 hours notice required for cancellations',
        contactInfo: 'Contact us at support@bookon.com or call 0800 123 456'
      };

      await this.sendTemplateEmail('booking_reminder', context);
      
      logger.info('Booking reminder email sent', {
        bookingId,
        parentEmail: context.parentEmail
      });
    } catch (error) {
      logger.error('Failed to send booking reminder email:', error);
    }
  }

  async sendCancellationNotification(bookingId: string, reason?: string): Promise<void> {
    try {
      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: { select: { firstName: true, lastName: true, email: true } },
            child: { select: { firstName: true, lastName: true } },
            activity: { 
              select: { 
                title: true, 
                startDate: true, 
                startTime: true, 
                price: true,
                venue: { select: { name: true, address: true } }
              } 
            }
          }
        });
      });

      if (!booking) {
        logger.warn(`Booking not found: ${bookingId}`);
        return;
      }

      const context: EmailContext = {
        parentId: booking.parentId,
        parentName: `${booking.parent.firstName} ${booking.parent.lastName}`,
        parentEmail: booking.parent.email,
        childName: `${booking.child.firstName} ${booking.child.lastName}`,
        activityName: booking.activity.title,
        venueName: booking.activity.venue.name,
        bookingDate: booking.activity.startDate.toISOString().split('T')[0],
        bookingTime: booking.activity.startTime,
        price: parseFloat(booking.activity.price.toString()),
        bookingReference: booking.id,
        cancellationPolicy: reason || 'Booking cancelled',
        contactInfo: 'Contact us at support@bookon.com or call 0800 123 456'
      };

      await this.sendTemplateEmail('cancellation', context);
      
      logger.info('Cancellation notification email sent', {
        bookingId,
        parentEmail: context.parentEmail
      });
    } catch (error) {
      logger.error('Failed to send cancellation notification email:', error);
    }
  }

  async sendWaitlistNotification(bookingId: string): Promise<void> {
    try {
      const booking = await safePrismaQuery(async (client) => {
        return await client.booking.findUnique({
          where: { id: bookingId },
          include: {
            parent: { select: { firstName: true, lastName: true, email: true } },
            child: { select: { firstName: true, lastName: true } },
            activity: { 
              select: { 
                title: true, 
                startDate: true, 
                startTime: true, 
                price: true,
                venue: { select: { name: true, address: true } }
              } 
            }
          }
        });
      });

      if (!booking) {
        logger.warn(`Booking not found: ${bookingId}`);
        return;
      }

      const context: EmailContext = {
        parentId: booking.parentId,
        parentName: `${booking.parent.firstName} ${booking.parent.lastName}`,
        parentEmail: booking.parent.email,
        childName: `${booking.child.firstName} ${booking.child.lastName}`,
        activityName: booking.activity.title,
        venueName: booking.activity.venue.name,
        bookingDate: booking.activity.startDate.toISOString().split('T')[0],
        bookingTime: booking.activity.startTime,
        price: parseFloat(booking.activity.price.toString()),
        bookingReference: booking.id,
        cancellationPolicy: 'A space has become available!',
        contactInfo: 'Contact us at support@bookon.com or call 0800 123 456'
      };

      await this.sendTemplateEmail('waitlist_notification', context);
      
      logger.info('Waitlist notification email sent', {
        bookingId,
        parentEmail: context.parentEmail
      });
    } catch (error) {
      logger.error('Failed to send waitlist notification email:', error);
    }
  }

  async sendPaymentConfirmation(transactionId: string): Promise<void> {
    try {
      const transaction = await safePrismaQuery(async (client) => {
        return await client.transaction.findUnique({
          where: { id: transactionId },
          include: {
            parent: { select: { firstName: true, lastName: true, email: true } },
            booking: {
              include: {
                child: { select: { firstName: true, lastName: true } },
                activity: { 
                  select: { 
                    title: true, 
                    startDate: true, 
                    startTime: true, 
                    price: true,
                    venue: { select: { name: true, address: true } }
                  } 
                }
              }
            }
          }
        });
      });

      if (!transaction || !transaction.booking) {
        logger.warn(`Transaction or booking not found: ${transactionId}`);
        return;
      }

      const context: EmailContext = {
        parentId: transaction.parentId,
        parentName: `${transaction.parent.firstName} ${transaction.parent.lastName}`,
        parentEmail: transaction.parent.email,
        childName: `${transaction.booking.child.firstName} ${transaction.booking.child.lastName}`,
        activityName: transaction.booking.activity.title,
        venueName: transaction.booking.activity.venue.name,
        bookingDate: transaction.booking.activity.startDate.toISOString().split('T')[0],
        bookingTime: transaction.booking.activity.startTime,
        price: parseFloat(transaction.amount.toString()),
        bookingReference: transaction.booking.id,
        cancellationPolicy: 'Payment received successfully',
        contactInfo: 'Contact us at support@bookon.com or call 0800 123 456'
      };

      await this.sendTemplateEmail('payment_success', context);
      
      logger.info('Payment confirmation email sent', {
        transactionId,
        parentEmail: context.parentEmail
      });
    } catch (error) {
      logger.error('Failed to send payment confirmation email:', error);
    }
  }

  private async sendTemplateEmail(trigger: string, context: EmailContext): Promise<void> {
    try {
      // Find the active template for this trigger
      const template = await safePrismaQuery(async (client) => {
        return await client.emailTemplate.findFirst({
          where: {
            trigger,
            active: true
          }
        });
      });

      if (!template) {
        logger.warn(`No active template found for trigger: ${trigger}`);
        return;
      }

      // Replace placeholders in subject and body
      const subject = this.replacePlaceholders(template.subjectTemplate, context);
      const htmlBody = this.replacePlaceholders(template.bodyHtmlTemplate, context);
      const textBody = template.bodyTextTemplate 
        ? this.replacePlaceholders(template.bodyTextTemplate, context)
        : undefined;

      // Send email
      const messageId = await emailService.sendEmail({
        to: context.parentEmail,
        toName: context.parentName,
        subject,
        htmlContent: htmlBody,
        textContent: textBody,
        templateId: template.id,
        trackingEnabled: true
      });

      if (messageId) {
        // Record the email in the database
        await safePrismaQuery(async (client) => {
          return await client.email.create({
            data: {
              templateId: template.id,
              parentId: context.parentId,
              toEmail: context.parentEmail,
              toName: context.parentName,
              messageType: trigger,
              subject,
              channel: 'email',
              providerMessageId: messageId,
              sentAt: new Date()
            }
          });
        });
      }
    } catch (error) {
      logger.error(`Failed to send template email for trigger ${trigger}:`, error);
    }
  }

  private replacePlaceholders(template: string, context: EmailContext): string {
    const placeholders: Record<string, string> = {
      '{ParentName}': context.parentName,
      '{ChildName}': context.childName || '',
      '{ActivityName}': context.activityName || '',
      '{Venue}': context.venueName || '',
      '{Date}': context.bookingDate || '',
      '{Time}': context.bookingTime || '',
      '{Price}': context.price ? `£${context.price.toFixed(2)}` : '',
      '{BookingReference}': context.bookingReference || '',
      '{CancellationPolicy}': context.cancellationPolicy || '',
      '{ContactInfo}': context.contactInfo || ''
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  async scheduleReminderEmails(): Promise<void> {
    try {
      // Find bookings that need reminder emails (24 hours before)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const bookings = await safePrismaQuery(async (client) => {
        return await client.booking.findMany({
          where: {
            status: 'confirmed',
            activity: {
              startDate: {
                gte: tomorrow,
                lt: dayAfter
              }
            }
          },
          select: { id: true }
        });
      });

      for (const booking of bookings) {
        await this.sendBookingReminder(booking.id);
      }

      logger.info(`Scheduled reminder emails for ${bookings.length} bookings`);
    } catch (error) {
      logger.error('Failed to schedule reminder emails:', error);
    }
  }
}

export const automatedEmailService = new AutomatedEmailService();
export default automatedEmailService;

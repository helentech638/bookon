import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // For development/testing, use a mock transporter
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'test@example.com',
          pass: process.env.EMAIL_PASS || 'test-password',
        },
      });

      logger.info('📧 Email service initialized');
    } catch (error) {
      logger.warn('📧 Email service initialization failed, using mock mode:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        // Mock email sending for development
        logger.info('📧 Mock email sent:', {
          to: options.to,
          subject: options.subject,
          html: options.html.substring(0, 100) + '...'
        });
        return true;
      }

      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM || 'noreply@bookon.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('📧 Email sent successfully:', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('📧 Failed to send email:', error);
      
      // In development, don't fail completely
      if (process.env.NODE_ENV === 'development') {
        logger.warn('📧 Email sending failed in development, continuing...');
        return true;
      }
      
      return false;
    }
  }

  async sendTemplatedEmail(
    templateId: string,
    to: string,
    variables: Record<string, any>
  ): Promise<boolean> {
    try {
      // Simple template system
      const templates = {
        'tfc-instructions': {
          subject: 'Tax-Free Childcare Payment Instructions',
          html: `
            <h2>Tax-Free Childcare Payment Instructions</h2>
            <p>Dear Parent,</p>
            <p>Please complete your payment using the following details:</p>
            <p><strong>Reference:</strong> ${variables.reference}</p>
            <p><strong>Amount:</strong> £${variables.amount}</p>
            <p><strong>Deadline:</strong> ${variables.deadline}</p>
            <p>Thank you for using BookOn!</p>
          `
        },
        'payment-confirmation': {
          subject: 'Payment Confirmed - Booking Confirmed',
          html: `
            <h2>Payment Confirmed!</h2>
            <p>Dear Parent,</p>
            <p>Your payment has been confirmed and your booking is now active.</p>
            <p><strong>Activity:</strong> ${variables.activityName}</p>
            <p><strong>Date:</strong> ${variables.activityDate}</p>
            <p><strong>Time:</strong> ${variables.activityTime}</p>
            <p>Thank you for using BookOn!</p>
          `
        },
        'cancellation-confirmation': {
          subject: 'Booking Cancellation Confirmed',
          html: `
            <h2>Booking Cancellation Confirmed</h2>
            <p>Dear Parent,</p>
            <p>Your booking has been cancelled as requested.</p>
            <p><strong>Refund Amount:</strong> £${variables.refundAmount}</p>
            <p><strong>Refund Method:</strong> ${variables.refundMethod}</p>
            <p>Thank you for using BookOn!</p>
          `
        },
        'credit-expiry-reminder': {
          subject: 'Credit Expiry Reminder',
          html: `
            <h2>Credit Expiry Reminder</h2>
            <p>Dear Parent,</p>
            <p>Your wallet credit of £${variables.creditAmount} will expire on ${variables.expiryDate}.</p>
            <p>Please use it before it expires!</p>
            <p>Thank you for using BookOn!</p>
          `
        }
      };

      const template = templates[templateId as keyof typeof templates];
      if (!template) {
        logger.error('📧 Template not found:', templateId);
        return false;
      }

      return await this.sendEmail({
        to,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.error('📧 Failed to send templated email:', error);
      return false;
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info('📧 Bulk email completed:', { sent, failed });
    return { sent, failed };
  }
}

export const emailService = new EmailService();

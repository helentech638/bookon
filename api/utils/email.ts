import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import AWS from 'aws-sdk';
import { logger } from './logger';

// Email service configuration
interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'mailhog';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  region?: string;
}

interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

class EmailService {
  private config: EmailConfig;
  private transporter: any;
  private sgMail: any;
  private ses: any;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeService();
  }

  private initializeService() {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          if (this.config.apiKey) {
            sgMail.setApiKey(this.config.apiKey);
            this.sgMail = sgMail;
          } else {
            throw new Error('SendGrid API key is required');
          }
          break;

        case 'ses':
          if (this.config.apiKey && this.config.region) {
            const secretKey = process.env['AWS_SECRET_ACCESS_KEY'];
            if (!secretKey) {
              throw new Error('AWS_SECRET_ACCESS_KEY is required for SES');
            }
            this.ses = new AWS.SES({
              accessKeyId: this.config.apiKey,
              secretAccessKey: secretKey,
              region: this.config.region,
            });
          } else {
            throw new Error('AWS SES credentials and region are required');
          }
          break;

        case 'mailhog':
          this.transporter = nodemailer.createTransport({
            host: 'localhost',
            port: 1025,
            secure: false,
            ignoreTLS: true,
          });
          break;

        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
      logger.info(`Email service initialized with provider: ${this.config.provider}`);
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { to, subject, html, text, attachments } = emailData;

      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid({ to, subject, html, ...(text && { text }), ...(attachments && { attachments }) });

        case 'ses':
          return await this.sendViaSES({ to, subject, html, ...(text && { text }), ...(attachments && { attachments }) });

        case 'mailhog':
          return await this.sendViaMailHog({ to, subject, html, ...(text && { text }), ...(attachments && { attachments }) });

        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  private async sendViaSendGrid(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      await this.sgMail.send(msg);
      logger.info(`Email sent via SendGrid to: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
      return true;
    } catch (error) {
      logger.error('SendGrid email failed:', error);
      return false;
    }
  }

  private async sendViaSES(emailData: EmailData): Promise<boolean> {
    try {
      const params = {
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        },
        Message: {
          Subject: {
            Data: emailData.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailData.html,
              Charset: 'UTF-8',
            },
            ...(emailData.text && {
              Text: {
                Data: emailData.text,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      };

      await this.ses.sendEmail(params).promise();
      logger.info(`Email sent via SES to: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
      return true;
    } catch (error) {
      logger.error('SES email failed:', error);
      return false;
    }
  }

  private async sendViaMailHog(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent via MailHog to: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
      return true;
    } catch (error) {
      logger.error('MailHog email failed:', error);
      return false;
    }
  }

  // Email template methods
  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to BookOn!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to BookOn!</h1>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining BookOn! We're excited to have you on board.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse available activities</li>
          <li>Book sessions for your children</li>
          <li>Manage your bookings</li>
          <li>Receive updates and notifications</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The BookOn Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendBookingConfirmation(to: string, firstName: string, bookingDetails: any): Promise<boolean> {
    const subject = 'Booking Confirmation - BookOn';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Booking Confirmation</h1>
        <p>Hi ${firstName},</p>
        <p>Your booking has been confirmed! Here are the details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Activity: ${bookingDetails.activityName}</h3>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.time}</p>
          <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
          <p><strong>Child:</strong> ${bookingDetails.childName}</p>
          <p><strong>Total:</strong> £${bookingDetails.total}</p>
        </div>
        <p>We'll send you a reminder 24 hours before the activity.</p>
        <p>Best regards,<br>The BookOn Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendReminderEmail(to: string, firstName: string, bookingDetails: any): Promise<boolean> {
    const subject = 'Activity Reminder - BookOn';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Activity Reminder</h1>
        <p>Hi ${firstName},</p>
        <p>This is a friendly reminder about tomorrow's activity:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Activity: ${bookingDetails.activityName}</h3>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.time}</p>
          <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
          <p><strong>Child:</strong> ${bookingDetails.childName}</p>
        </div>
        <p>Please arrive 10 minutes before the start time.</p>
        <p>Best regards,<br>The BookOn Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const subject = 'Password Reset Request - BookOn';
    const resetUrl = `${process.env['FRONTEND_URL']}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>You requested a password reset for your BookOn account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The BookOn Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

// Create and export email service instance
const emailService = new EmailService({
  provider: (process.env['EMAIL_PROVIDER'] as 'sendgrid' | 'ses' | 'mailhog') || 'mailhog',
  ...(process.env['EMAIL_API_KEY'] && { apiKey: process.env['EMAIL_API_KEY'] }),
  fromEmail: process.env['FROM_EMAIL'] || 'noreply@bookon.com',
  fromName: process.env['FROM_NAME'] || 'BookOn',
  ...(process.env['AWS_REGION'] && { region: process.env['AWS_REGION'] }),
});

export default emailService;
export { EmailService, type EmailData, type EmailConfig };

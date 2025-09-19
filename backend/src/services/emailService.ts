import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

interface EmailData {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailEvent {
  emailId: string;
  eventType: string;
  timestamp: string;
  metadata?: any;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@bookon.com';
    this.fromName = process.env.FROM_NAME || 'BookOn';

    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  async sendEmail(emailData: EmailData): Promise<string | null> {
    try {
      if (!this.apiKey) {
        logger.warn('SendGrid API key not configured, skipping email send');
        return null;
      }

      const msg = {
        to: emailData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers?.['x-message-id'];
      
      logger.info('Email sent successfully', {
        to: emailData.to,
        subject: emailData.subject,
        messageId
      });

      return messageId || null;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send TFC payment confirmation email
   */
  async sendTFCPaymentConfirmation(booking: any): Promise<void> {
    try {
      const emailData = {
        to: booking.parent.email,
        toName: `${booking.parent.firstName} ${booking.parent.lastName}`,
        subject: `Payment Confirmed - ${booking.activity.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00806a;">Payment Confirmed!</h2>
            
            <p>Hi ${booking.parent.firstName},</p>
            
            <p>Great news! Your Tax-Free Childcare payment has been received and your booking is now confirmed.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
              <p><strong>Child:</strong> ${booking.child.firstName} ${booking.child.lastName}</p>
              <p><strong>Activity:</strong> ${booking.activity.title}</p>
              <p><strong>Venue:</strong> ${booking.activity.venue.name}</p>
              <p><strong>Date:</strong> ${new Date(booking.activityDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${booking.activityTime}</p>
              <p><strong>Amount:</strong> £${booking.amount}</p>
              <p><strong>TFC Reference:</strong> ${booking.tfcReference}</p>
            </div>
            
            <p>Your child's place is now secured. Please arrive 10 minutes before the start time.</p>
            
            <p>Thank you for choosing BookOn!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              This email was sent to ${booking.parent.email} regarding booking ${booking.tfcReference}.
            </p>
          </div>
        `,
        text: `
          Payment Confirmed!
          
          Hi ${booking.parent.firstName},
          
          Great news! Your Tax-Free Childcare payment has been received and your booking is now confirmed.
          
          Booking Details:
          - Child: ${booking.child.firstName} ${booking.child.lastName}
          - Activity: ${booking.activity.title}
          - Venue: ${booking.activity.venue.name}
          - Date: ${new Date(booking.activityDate).toLocaleDateString()}
          - Time: ${booking.activityTime}
          - Amount: £${booking.amount}
          - TFC Reference: ${booking.tfcReference}
          
          Your child's place is now secured. Please arrive 10 minutes before the start time.
          
          Thank you for choosing BookOn!
        `
      };

      await this.sendEmail(emailData);
      logger.info('TFC payment confirmation email sent', {
        bookingId: booking.id,
        parentEmail: booking.parent.email,
        tfcReference: booking.tfcReference
      });

    } catch (error) {
      logger.error('Failed to send TFC payment confirmation email:', error);
      throw error;
    }
  }

  processWebhookEvent(event: any): EmailEvent | null {
    try {
      if (!event || typeof event !== 'object') {
        return null;
      }

      const emailEvent: EmailEvent = {
        emailId: event.sg_message_id || event.message_id || '',
        eventType: this.mapEventType(event.event || event.type || ''),
        timestamp: event.timestamp || new Date().toISOString(),
        metadata: {
          sgEventId: event.sg_event_id,
          sgMessageId: event.sg_message_id,
          reason: event.reason,
          url: event.url,
          userAgent: event.useragent,
          ip: event.ip
        }
      };

      return emailEvent;
    } catch (error) {
      logger.error('Error processing webhook event:', error);
      return null;
    }
  }

  private mapEventType(sendGridEventType: string): string {
    const eventTypeMap: Record<string, string> = {
      'processed': 'sent',
      'delivered': 'delivered',
      'open': 'opened',
      'click': 'clicked',
      'bounce': 'bounced',
      'dropped': 'bounced',
      'spam_report': 'bounced',
      'unsubscribe': 'unsubscribed'
    };

    return eventTypeMap[sendGridEventType] || sendGridEventType;
  }
}

export const emailService = new EmailService();
export { EmailService };
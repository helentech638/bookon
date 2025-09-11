import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

interface EmailData {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: string;
  placeholders?: Record<string, string>;
  trackingEnabled?: boolean;
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
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@bookon.com';
    this.fromName = process.env.FROM_NAME || 'BookOn';
    this.webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET || '';

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
        html: emailData.htmlContent,
        text: emailData.textContent,
        trackingSettings: {
          clickTracking: {
            enable: emailData.trackingEnabled !== false
          },
          openTracking: {
            enable: emailData.trackingEnabled !== false
          }
        },
        customArgs: {
          emailId: emailData.templateId || 'unknown'
        }
      };

      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers?.['x-message-id'] as string;
      
      logger.info('Email sent successfully', {
        to: emailData.to,
        subject: emailData.subject,
        messageId
      });

      return messageId;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendTemplateEmail(
    templateId: string,
    to: string,
    toName: string,
    placeholders: Record<string, string> = {}
  ): Promise<string | null> {
    try {
      if (!this.apiKey) {
        logger.warn('SendGrid API key not configured, skipping template email send');
        return null;
      }

      const msg = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        templateId: templateId,
        dynamicTemplateData: {
          to_name: toName,
          ...placeholders
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        customArgs: {
          templateId,
          emailId: `template_${templateId}_${Date.now()}`
        }
      };

      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers?.['x-message-id'] as string;
      
      logger.info('Template email sent successfully', {
        to,
        templateId,
        messageId
      });

      return messageId;
    } catch (error) {
      logger.error('Failed to send template email:', error);
      throw error;
    }
  }

  async sendBulkEmails(emails: EmailData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // SendGrid allows up to 1000 emails per request
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        const messages = batch.map(emailData => ({
          to: emailData.to,
          from: {
            email: this.fromEmail,
            name: this.fromName
          },
          subject: emailData.subject,
          html: emailData.htmlContent,
          text: emailData.textContent,
          trackingSettings: {
            clickTracking: { enable: emailData.trackingEnabled !== false },
            openTracking: { enable: emailData.trackingEnabled !== false }
          },
          customArgs: {
            emailId: emailData.templateId || 'unknown'
          }
        }));

        await sgMail.send(messages);
        success += batch.length;
        
        logger.info(`Batch of ${batch.length} emails sent successfully`);
      } catch (error) {
        logger.error(`Failed to send batch of ${batch.length} emails:`, error);
        failed += batch.length;
      }
    }

    return { success, failed };
  }

  processWebhookEvent(event: any): EmailEvent | null {
    try {
      // Verify webhook signature if secret is configured
      if (this.webhookSecret) {
        // Add signature verification logic here
        // This is a simplified version - implement proper HMAC verification
      }

      const eventType = event.event;
      const emailId = event.sg_message_id;
      const timestamp = event.timestamp;

      if (!emailId || !eventType) {
        logger.warn('Invalid webhook event received:', event);
        return null;
      }

      const emailEvent: EmailEvent = {
        emailId,
        eventType: this.mapEventType(eventType),
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        metadata: {
          userAgent: event.useragent,
          ip: event.ip,
          url: event.url,
          reason: event.reason,
          response: event.response,
          attempt: event.attempt,
          category: event.category,
          sgEventId: event.sg_event_id,
          sgMessageId: event.sg_message_id
        }
      };

      logger.info('Email event processed', {
        emailId,
        eventType: emailEvent.eventType,
        timestamp: emailEvent.timestamp
      });

      return emailEvent;
    } catch (error) {
      logger.error('Failed to process webhook event:', error);
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
      'dropped': 'dropped',
      'spam_report': 'spam_report',
      'unsubscribe': 'unsubscribed',
      'group_unsubscribe': 'unsubscribed',
      'group_resubscribe': 'resubscribed'
    };

    return eventTypeMap[sendGridEventType] || sendGridEventType;
  }

  async validateEmail(email: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return true; // Skip validation if no API key
      }

      // Use SendGrid's email validation API
      const response = await fetch('https://api.sendgrid.com/v3/validations/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result?.valid === true;
      }

      return true; // Default to valid if validation fails
    } catch (error) {
      logger.error('Email validation failed:', error);
      return true; // Default to valid if validation fails
    }
  }

  async getEmailStats(startDate: string, endDate: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await fetch(
        `https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch email stats:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const emailService = new EmailService();
export default emailService;
import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { prisma, safePrismaQuery } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';

const router = Router();

// SendGrid webhook endpoint
router.post('/sendgrid', asyncHandler(async (req: Request, res: Response) => {
  try {
    const events = req.body;
    
    if (!Array.isArray(events)) {
      throw new AppError('Invalid webhook payload', 400, 'INVALID_PAYLOAD');
    }

    logger.info(`Processing ${events.length} SendGrid webhook events`);

    for (const event of events) {
      try {
        const emailEvent = emailService.processWebhookEvent(event);
        
        if (!emailEvent) {
          logger.warn('Skipping invalid webhook event:', event);
          continue;
        }

        // Find the email record by provider message ID
        const email = await safePrismaQuery(async (client) => {
          return await client.email.findFirst({
            where: {
              providerMessageId: emailEvent.emailId
            }
          });
        });

        if (!email) {
          logger.warn(`Email not found for message ID: ${emailEvent.emailId}`);
          continue;
        }

        // Create email event record
        await safePrismaQuery(async (client) => {
          return await client.emailEvent.create({
            data: {
              emailId: email.id,
              eventType: emailEvent.eventType,
              providerEventId: emailEvent.metadata?.sgEventId,
              meta: emailEvent.metadata,
              occurredAt: new Date(emailEvent.timestamp)
            }
          });
        });

        // Update email status based on event type
        const statusMap: Record<string, string> = {
          'sent': 'sent',
          'delivered': 'delivered',
          'opened': 'opened',
          'clicked': 'clicked',
          'bounced': 'bounced',
          'dropped': 'bounced',
          'spam_report': 'bounced',
          'unsubscribed': 'unsubscribed'
        };

        const newStatus = statusMap[emailEvent.eventType];
        if (newStatus && newStatus !== email.lastStatus) {
          await safePrismaQuery(async (client) => {
            return await client.email.update({
              where: { id: email.id },
              data: {
                lastStatus: newStatus,
                lastStatusAt: new Date(emailEvent.timestamp)
              }
            });
          });

          logger.info(`Updated email status`, {
            emailId: email.id,
            oldStatus: email.lastStatus,
            newStatus,
            eventType: emailEvent.eventType
          });
        }

        // Handle unsubscribe events
        if (emailEvent.eventType === 'unsubscribed') {
          await handleUnsubscribe(email.parentId, email.toEmail);
        }

      } catch (eventError) {
        logger.error('Error processing individual webhook event:', eventError);
        // Continue processing other events even if one fails
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('SendGrid webhook processing error:', error);
    throw new AppError('Webhook processing failed', 500, 'WEBHOOK_ERROR');
  }
}));

// Handle unsubscribe
async function handleUnsubscribe(parentId: string, email: string) {
  try {
    // Create or update unsubscribe record
    await safePrismaQuery(async (client) => {
      return await client.user.update({
        where: { id: parentId },
        data: {
          emailVerified: false,
          // Add unsubscribe timestamp if you have that field
        }
      });
    });

    logger.info('User unsubscribed from emails', {
      parentId,
      email
    });
  } catch (error) {
    logger.error('Error handling unsubscribe:', error);
  }
}

// Generic webhook endpoint for other ESPs
router.post('/email', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { provider, events } = req.body;
    
    if (!provider || !events) {
      throw new AppError('Missing provider or events', 400, 'MISSING_DATA');
    }

    logger.info(`Processing ${events.length} ${provider} webhook events`);

    for (const event of events) {
      try {
        // Process based on provider
        let emailEvent;
        
        switch (provider) {
          case 'sendgrid':
            emailEvent = emailService.processWebhookEvent(event);
            break;
          case 'postmark':
            emailEvent = processPostmarkEvent(event);
            break;
          case 'mailgun':
            emailEvent = processMailgunEvent(event);
            break;
          default:
            logger.warn(`Unknown email provider: ${provider}`);
            continue;
        }

        if (!emailEvent) {
          continue;
        }

        // Find and update email record (same logic as SendGrid)
        const email = await safePrismaQuery(async (client) => {
          return await client.email.findFirst({
            where: {
              providerMessageId: emailEvent.emailId
            }
          });
        });

        if (email) {
          await safePrismaQuery(async (client) => {
            return await client.emailEvent.create({
              data: {
                emailId: email.id,
                eventType: emailEvent.eventType,
                providerEventId: emailEvent.metadata?.eventId,
                meta: emailEvent.metadata,
                occurredAt: new Date(emailEvent.timestamp)
              }
            });
          });
        }

      } catch (eventError) {
        logger.error('Error processing webhook event:', eventError);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Generic webhook processing error:', error);
    throw new AppError('Webhook processing failed', 500, 'WEBHOOK_ERROR');
  }
}));

// Postmark event processor
function processPostmarkEvent(event: any): any {
  const eventTypeMap: Record<string, string> = {
    'Sent': 'sent',
    'Delivered': 'delivered',
    'Opened': 'opened',
    'Clicked': 'clicked',
    'Bounced': 'bounced',
    'SpamComplaint': 'spam_report',
    'Unsubscribe': 'unsubscribed'
  };

  return {
    emailId: event.MessageID,
    eventType: eventTypeMap[event.RecordType] || event.RecordType,
    timestamp: event.DeliveredAt || event.OpenedAt || event.ClickedAt || event.BouncedAt || new Date().toISOString(),
    metadata: {
      tag: event.Tag,
      metadata: event.Metadata,
      serverId: event.ServerID,
      messageStream: event.MessageStream
    }
  };
}

// Mailgun event processor
function processMailgunEvent(event: any): any {
  const eventTypeMap: Record<string, string> = {
    'accepted': 'sent',
    'delivered': 'delivered',
    'opened': 'opened',
    'clicked': 'clicked',
    'bounced': 'bounced',
    'dropped': 'bounced',
    'complained': 'spam_report',
    'unsubscribed': 'unsubscribed'
  };

  return {
    emailId: event['message-id'],
    eventType: eventTypeMap[event.event] || event.event,
    timestamp: event.timestamp ? new Date(event.timestamp * 1000).toISOString() : new Date().toISOString(),
    metadata: {
      recipient: event.recipient,
      domain: event.domain,
      campaign: event.campaign,
      tag: event.tag,
      userVariables: event['user-variables']
    }
  };
}

// Test webhook endpoint
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}));

export default router;
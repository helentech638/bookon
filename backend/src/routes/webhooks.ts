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

// Get webhook events
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', eventType, source, processed } = req.query;
    
    const whereClause: any = {};
    if (eventType) whereClause.eventType = eventType;
    if (source) whereClause.source = source;
    if (processed !== undefined) whereClause.processed = processed === 'true';

    const events = await safePrismaQuery(async (client) => {
      return await client.webhookEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      });
    });

    const totalCount = await safePrismaQuery(async (client) => {
      return await client.webhookEvent.count({ where: whereClause });
    });

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching webhook events:', error);
    throw new AppError('Failed to fetch webhook events', 500, 'WEBHOOK_EVENTS_ERROR');
  }
}));

// Get webhook stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await safePrismaQuery(async (client) => {
      const [
        totalEvents,
        processedEvents,
        failedEvents,
        eventsByType,
        eventsBySource,
        recentEvents
      ] = await Promise.all([
        client.webhookEvent.count(),
        client.webhookEvent.count({ where: { processed: true } }),
        client.webhookEvent.count({ where: { processed: false } }),
        client.webhookEvent.groupBy({
          by: ['eventType'],
          _count: { eventType: true }
        }),
        client.webhookEvent.groupBy({
          by: ['source'],
          _count: { source: true }
        }),
        client.webhookEvent.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      return {
        totalEvents,
        processedEvents,
        failedEvents,
        successRate: totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0,
        eventsByType: eventsByType.reduce((acc, item) => {
          acc[item.eventType] = item._count.eventType;
          return acc;
        }, {} as Record<string, number>),
        eventsBySource: eventsBySource.reduce((acc, item) => {
          acc[item.source] = item._count.source;
          return acc;
        }, {} as Record<string, number>),
        recentEvents
      };
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching webhook stats:', error);
    throw new AppError('Failed to fetch webhook stats', 500, 'WEBHOOK_STATS_ERROR');
  }
}));

// Test webhook endpoint
router.get('/test', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}));

export default router;
import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Setup Phase 5 tables endpoint
router.post('/phase5-tables', asyncHandler(async (_req: Request, res: Response) => {
  try {
    logger.info('🔧 Setting up Phase 5 tables...');
    
    // Create webhook_events table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(255) NOT NULL,
        source VARCHAR(255) NOT NULL,
        data JSONB,
        processed BOOLEAN DEFAULT false,
        error TEXT,
        retry_count INTEGER DEFAULT 0,
        external_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `;
    
    // Create notifications table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        priority VARCHAR(50) DEFAULT 'medium',
        channels TEXT[],
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "venueId" UUID,
        status VARCHAR(50) DEFAULT 'pending',
        read BOOLEAN DEFAULT false,
        error TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "sentAt" TIMESTAMP,
        "readAt" TIMESTAMP
      )
    `;
    
    // Add missing fields to users table
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripe_customer_id" VARCHAR(255)
    `;
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "venueId" UUID
    `;
    
    // Add missing fields to bookings table
    await prisma.$executeRaw`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'pending'
    `;
    await prisma.$executeRaw`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payment_intent_id" VARCHAR(255)
    `;
    await prisma.$executeRaw`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(10,2)
    `;
    
    // Create indexes for better performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)
    `;
    
    logger.info('✅ Phase 5 tables created successfully');
    
    res.json({
      success: true,
      message: 'Phase 5 tables created successfully',
      tables: [
        'webhook_events',
        'notifications',
        'users (updated)',
        'bookings (updated)'
      ]
    });
    
  } catch (error) {
    logger.error('❌ Failed to create Phase 5 tables:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create Phase 5 tables',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}));

// Test Phase 5 tables endpoint
router.get('/phase5-tables', asyncHandler(async (_req: Request, res: Response) => {
  try {
    logger.info('🔍 Testing Phase 5 tables...');
    
    // Test webhook_events table
    const webhookCount = await prisma.$executeRaw`
      SELECT COUNT(*) as count FROM webhook_events
    `;
    
    // Test notifications table
    const notificationCount = await prisma.$executeRaw`
      SELECT COUNT(*) as count FROM notifications
    `;
    
    // Test if new fields exist in users table
    const userFields = await prisma.$executeRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('stripe_customer_id', 'venueId')
    `;
    
    // Test if new fields exist in bookings table
    const bookingFields = await prisma.$executeRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name IN ('payment_status', 'payment_intent_id', 'total_amount')
    `;
    
    logger.info('✅ Phase 5 tables test completed');
    
    res.json({
      success: true,
      message: 'Phase 5 tables test completed',
      data: {
        webhook_events: { exists: true, count: webhookCount },
        notifications: { exists: true, count: notificationCount },
        user_fields: userFields,
        booking_fields: bookingFields
      }
    });
    
  } catch (error) {
    logger.error('❌ Phase 5 tables test failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Phase 5 tables test failed',
        details: error instanceof Error ? error.message : String(error)
      }
    });
  }
}));

export default router;
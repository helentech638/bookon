-- Phase 5: Webhooks & Real-time Features Database Tables
-- Run this SQL script in Supabase SQL Editor to create the required tables

-- Add missing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripe_customer_id" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "venueId" UUID;

-- Add missing fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payment_intent_id" VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(10,2);

-- Create webhook_events table
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
);

-- Create notifications table
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_venue_id ON notifications("venueId");
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");

-- Insert some sample webhook events for testing
INSERT INTO webhook_events (event_type, source, data, processed) VALUES
('payment_intent.succeeded', 'stripe', '{"payment_intent_id": "pi_test_123", "amount": 5000}', true),
('booking.created', 'external', '{"booking_id": "booking_123", "activity_id": "activity_456"}', true),
('user.created', 'external', '{"user_id": "user_789", "email": "test@example.com"}', false)
ON CONFLICT DO NOTHING;

-- Insert some sample notifications for testing
INSERT INTO notifications (type, title, message, priority, channels, "userId", status, read) VALUES
('booking_confirmation', 'Booking Confirmed!', 'Your booking for Football Training has been confirmed.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false),
('payment_success', 'Payment Successful!', 'Your payment of $50.00 has been processed successfully.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false),
('system_alert', 'System Maintenance', 'Scheduled maintenance will occur tonight from 2-4 AM.', 'high', ARRAY['in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
  'webhook_events' as table_name, 
  COUNT(*) as row_count 
FROM webhook_events
UNION ALL
SELECT 
  'notifications' as table_name, 
  COUNT(*) as row_count 
FROM notifications;

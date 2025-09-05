-- Phase 5: Webhooks & Real-time Features Migration
-- Run this in Supabase SQL Editor

-- First, create all core tables if they don't exist

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'parent',
  stripe_customer_id VARCHAR(255),
  venueId UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  age_min INTEGER,
  age_max INTEGER,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  max_participants INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_intent_id VARCHAR(255),
  total_amount DECIMAL(10,2),
  booking_date DATE,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing fields to users table (if they already exist)
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

-- Insert sample data for testing
INSERT INTO webhook_events (event_type, source, data, processed) VALUES
('payment_intent.succeeded', 'stripe', '{"payment_intent_id": "pi_test_123", "amount": 5000}', true),
('booking.created', 'external', '{"booking_id": "booking_123", "activity_id": "activity_456"}', true),
('user.created', 'external', '{"user_id": "user_789", "email": "test@example.com"}', false)
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (type, title, message, priority, channels, "userId", status, read) VALUES
('booking_confirmation', 'Booking Confirmed!', 'Your booking for Football Training has been confirmed.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false),
('payment_success', 'Payment Successful!', 'Your payment of $50.00 has been processed successfully.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false),
('system_alert', 'System Maintenance', 'Scheduled maintenance will occur tonight from 2-4 AM.', 'high', ARRAY['in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false)
ON CONFLICT DO NOTHING;

-- Insert sample data for testing
-- First check what columns exist in venues table and insert accordingly
INSERT INTO venues (name, description, address) VALUES
('Sports Complex', 'Modern sports facility with multiple courts and fields', '123 Sports Ave, City'),
('Community Center', 'Local community center offering various activities', '456 Community St, City')
ON CONFLICT DO NOTHING;

INSERT INTO activities (name, description, venue_id, age_min, age_max, price, duration_minutes, max_participants) VALUES
('Football Training', 'Professional football training for kids', (SELECT id FROM venues WHERE name = 'Sports Complex' LIMIT 1), 6, 12, 25.00, 60, 15),
('Basketball Clinic', 'Basketball skills development', (SELECT id FROM venues WHERE name = 'Sports Complex' LIMIT 1), 8, 16, 30.00, 90, 12),
('Art Workshop', 'Creative art and craft activities', (SELECT id FROM venues WHERE name = 'Community Center' LIMIT 1), 5, 10, 20.00, 45, 20)
ON CONFLICT DO NOTHING;

-- Insert sample children (if admin user exists)
INSERT INTO children (first_name, last_name, date_of_birth, parent_id) VALUES
('Emma', 'Johnson', '2015-03-15', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1)),
('Liam', 'Smith', '2017-07-22', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (parent_id, child_id, activity_id, status, payment_status, total_amount, booking_date) VALUES
((SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 
 (SELECT id FROM children WHERE first_name = 'Emma' LIMIT 1),
 (SELECT id FROM activities WHERE name = 'Football Training' LIMIT 1),
 'confirmed', 'paid', 25.00, CURRENT_DATE + INTERVAL '7 days'),
((SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1),
 (SELECT id FROM children WHERE first_name = 'Liam' LIMIT 1),
 (SELECT id FROM activities WHERE name = 'Art Workshop' LIMIT 1),
 'pending', 'pending', 20.00, CURRENT_DATE + INTERVAL '14 days')
ON CONFLICT DO NOTHING;

-- Verify the tables were created
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'venues' as table_name, COUNT(*) as row_count FROM venues
UNION ALL
SELECT 'activities' as table_name, COUNT(*) as row_count FROM activities
UNION ALL
SELECT 'children' as table_name, COUNT(*) as row_count FROM children
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as row_count FROM bookings
UNION ALL
SELECT 'webhook_events' as table_name, COUNT(*) as row_count FROM webhook_events
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications;

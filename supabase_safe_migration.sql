-- Safe Migration Script - Only creates what doesn't exist
-- Run this in Supabase SQL Editor

-- Check and create users table with all necessary columns
DO $$ 
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
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
    ELSE
        -- Add missing columns if they don't exist
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripe_customer_id" VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "venueId" UUID;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'parent';
    END IF;
END $$;

-- Check and create venues table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'venues') THEN
        CREATE TABLE venues (
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
    ELSE
        -- Add missing columns if they don't exist
        ALTER TABLE venues ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        ALTER TABLE venues ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        ALTER TABLE venues ADD COLUMN IF NOT EXISTS website VARCHAR(255);
    END IF;
END $$;

-- Check and create activities table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
        CREATE TABLE activities (
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
    END IF;
END $$;

-- Check and create children table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'children') THEN
        CREATE TABLE children (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            date_of_birth DATE,
            parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Check and create bookings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bookings') THEN
        CREATE TABLE bookings (
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
    ELSE
        -- Add missing columns if they don't exist
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
    END IF;
END $$;

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

-- Insert sample data only if tables are empty
-- First check if ownerId column exists and handle accordingly
INSERT INTO venues (name, description, address, "ownerId") 
SELECT 'Sports Complex', 'Modern sports facility with multiple courts and fields', '123 Sports Ave, City', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Sports Complex')
AND EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com');

INSERT INTO venues (name, description, address, "ownerId") 
SELECT 'Community Center', 'Local community center offering various activities', '456 Community St, City', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Community Center')
AND EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com');

-- Insert sample activities
INSERT INTO activities (name, description, venue_id, age_min, age_max, price, duration_minutes, max_participants) 
SELECT 'Football Training', 'Professional football training for kids', 
       (SELECT id FROM venues WHERE name = 'Sports Complex' LIMIT 1), 6, 12, 25.00, 60, 15
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Football Training');

INSERT INTO activities (name, description, venue_id, age_min, age_max, price, duration_minutes, max_participants) 
SELECT 'Basketball Clinic', 'Basketball skills development', 
       (SELECT id FROM venues WHERE name = 'Sports Complex' LIMIT 1), 8, 16, 30.00, 90, 12
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Basketball Clinic');

INSERT INTO activities (name, description, venue_id, age_min, age_max, price, duration_minutes, max_participants) 
SELECT 'Art Workshop', 'Creative art and craft activities', 
       (SELECT id FROM venues WHERE name = 'Community Center' LIMIT 1), 5, 10, 20.00, 45, 20
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Art Workshop');

-- Insert sample children (if admin user exists)
INSERT INTO children (first_name, last_name, date_of_birth, parent_id) 
SELECT 'Emma', 'Johnson', '2015-03-15', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND NOT EXISTS (SELECT 1 FROM children WHERE first_name = 'Emma' AND last_name = 'Johnson');

INSERT INTO children (first_name, last_name, date_of_birth, parent_id) 
SELECT 'Liam', 'Smith', '2017-07-22', (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND NOT EXISTS (SELECT 1 FROM children WHERE first_name = 'Liam' AND last_name = 'Smith');

-- Insert sample bookings
INSERT INTO bookings (parent_id, child_id, activity_id, status, payment_status, total_amount, booking_date) 
SELECT (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 
       (SELECT id FROM children WHERE first_name = 'Emma' LIMIT 1),
       (SELECT id FROM activities WHERE name = 'Football Training' LIMIT 1),
       'confirmed', 'paid', 25.00, CURRENT_DATE + INTERVAL '7 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND EXISTS (SELECT 1 FROM children WHERE first_name = 'Emma')
AND EXISTS (SELECT 1 FROM activities WHERE name = 'Football Training')
AND NOT EXISTS (SELECT 1 FROM bookings WHERE child_id = (SELECT id FROM children WHERE first_name = 'Emma' LIMIT 1) 
                AND activity_id = (SELECT id FROM activities WHERE name = 'Football Training' LIMIT 1));

-- Insert sample webhook events
INSERT INTO webhook_events (event_type, source, data, processed) VALUES
('payment_intent.succeeded', 'stripe', '{"payment_intent_id": "pi_test_123", "amount": 5000}', true),
('booking.created', 'external', '{"booking_id": "booking_123", "activity_id": "activity_456"}', true),
('user.created', 'external', '{"user_id": "user_789", "email": "test@example.com"}', false)
ON CONFLICT DO NOTHING;

-- Insert sample notifications (only if admin user exists)
INSERT INTO notifications (type, title, message, priority, channels, "userId", status, read) 
SELECT 'booking_confirmation', 'Booking Confirmed!', 'Your booking for Football Training has been confirmed.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Booking Confirmed!');

INSERT INTO notifications (type, title, message, priority, channels, "userId", status, read) 
SELECT 'payment_success', 'Payment Successful!', 'Your payment of $50.00 has been processed successfully.', 'medium', ARRAY['email', 'in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Payment Successful!');

INSERT INTO notifications (type, title, message, priority, channels, "userId", status, read) 
SELECT 'system_alert', 'System Maintenance', 'Scheduled maintenance will occur tonight from 2-4 AM.', 'high', ARRAY['in_app'], (SELECT id FROM users WHERE email = 'admin@bookon.com' LIMIT 1), 'sent', false
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'admin@bookon.com')
AND NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'System Maintenance');

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

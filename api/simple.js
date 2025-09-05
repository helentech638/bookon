// Very simple test for Vercel
console.log('🚀 Test file loaded');

// Standard Vercel function export
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log('📝 Request received:', req.method, req.url);
  
  try {
    if (req.url === '/ping') {
      return res.json({ message: 'pong', timestamp: new Date().toISOString() });
    }
    
    if (req.url === '/health') {
      return res.json({ status: 'OK', timestamp: new Date().toISOString() });
    }
    
    if (req.url === '/') {
      return res.json({ 
        message: 'BookOn API is running successfully!',
        version: '1.0.0',
        status: 'active',
        timestamp: new Date().toISOString(),
        endpoints: ['/ping', '/health', '/api/v1/auth/*', '/api/v1/dashboard/*', '/api/v1/admin/*', '/api/v1/venues/*', '/api/v1/activities/*', '/api/v1/children/*', '/api/v1/bookings/*', '/api/v1/payments/*', '/api/v1/widget/*', '/api/v1/registers/*']
      });
    }
    
    // Handle auth endpoints
    if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
      console.log('Login attempt:', req.body);
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required',
            code: 'MISSING_CREDENTIALS'
          }
        });
      }
      
      // Mock login for testing
      if (email === 'admin@bookon.com' || email === 'test@bookon.com') {
        return res.json({
          success: true,
          message: 'Login successful (mock mode)',
          data: {
            user: {
              id: 'mock-user-id',
              email: email,
              firstName: 'Admin',
              lastName: 'User',
              role: 'admin',
            },
            tokens: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
          },
        });
      }
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    if (req.url === '/api/v1/auth/logout' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Logout successful'
      });
    }

    if (req.url === '/api/v1/auth/refresh' && req.method === 'POST') {
      return res.json({
        success: true,
        data: {
          accessToken: 'new-mock-access-token'
        }
      });
    }

    if (req.url === '/api/v1/auth/profile' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'mock-user-id',
            email: 'admin@bookon.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          }
        }
      });
    }

    if (req.url === '/api/v1/auth/profile' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    }

    if (req.url === '/api/v1/auth/change-password' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    }

    // Handle dashboard routes
    if (req.url === '/api/v1/dashboard/stats' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          totalBookings: 25,
          activeActivities: 8,
          totalRevenue: 1250.00,
          pendingApprovals: 3
        }
      });
    }

    if (req.url === '/api/v1/dashboard/profile' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'mock-user-id',
            email: 'admin@bookon.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          }
        }
      });
    }

    if (req.url === '/api/v1/dashboard/recent-activities' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Swimming Class', date: '2025-08-31', status: 'active' },
          { id: 2, name: 'Art Workshop', date: '2025-08-30', status: 'completed' }
        ]
      });
    }

    // Handle admin routes
    if (req.url === '/api/v1/admin/stats' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          totalUsers: 150,
          totalVenues: 12,
          totalActivities: 45,
          totalBookings: 320,
          monthlyRevenue: 8500.00
        }
      });
    }

    if (req.url === '/api/v1/admin/venues' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Main Hall', capacity: 100, status: 'active' },
          { id: 2, name: 'Swimming Pool', capacity: 30, status: 'active' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/activities' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Swimming Class', venue: 'Swimming Pool', status: 'active' },
          { id: 2, name: 'Art Workshop', venue: 'Main Hall', status: 'active' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/users' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, email: 'admin@bookon.com', role: 'admin', status: 'active' },
          { id: 2, email: 'parent@bookon.com', role: 'parent', status: 'active' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/users' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'User updated successfully'
      });
    }

    if (req.url.startsWith('/api/v1/admin/bookings') && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { 
            id: 1, 
            activity: { name: 'Swimming Class' }, 
            user: { name: 'John Doe', email: 'parent@bookon.com' }, 
            venue: { name: 'Swimming Pool' },
            status: 'confirmed',
            totalAmount: 25.00
          },
          { 
            id: 2, 
            activity: { name: 'Art Workshop' }, 
            user: { name: 'Jane Smith', email: 'parent@bookon.com' }, 
            venue: { name: 'Main Hall' },
            status: 'pending',
            totalAmount: 30.00
          }
        ]
      });
    }

    if (req.url === '/api/v1/admin/recent-bookings' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { 
            id: 1, 
            activity: { name: 'Swimming Class' }, 
            user: { name: 'John Doe', email: 'parent@bookon.com' }, 
            venue: { name: 'Swimming Pool' },
            status: 'confirmed', 
            date: '2025-08-31',
            totalAmount: 25.00
          },
          { 
            id: 2, 
            activity: { name: 'Art Workshop' }, 
            user: { name: 'Jane Smith', email: 'parent@bookon.com' }, 
            venue: { name: 'Main Hall' },
            status: 'pending', 
            date: '2025-08-30',
            totalAmount: 30.00
          }
        ]
      });
    }

    if (req.url === '/api/v1/admin/bookings' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Booking status updated successfully'
      });
    }

    if (req.url === '/api/v1/admin/payment-settings' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          stripeEnabled: true,
          paypalEnabled: false,
          defaultCurrency: 'USD'
        }
      });
    }

    if (req.url === '/api/v1/admin/payment-settings' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Payment settings updated successfully'
      });
    }

    if (req.url === '/api/v1/admin/venue-payment-accounts' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, venue: 'Main Hall', accountType: 'stripe', status: 'active' },
          { id: 2, venue: 'Swimming Pool', accountType: 'stripe', status: 'active' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/venue-payment-accounts' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Venue payment account updated successfully'
      });
    }

    if (req.url === '/api/v1/admin/notifications' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, title: 'New Booking', message: 'New booking received', read: false, date: '2025-08-31' },
          { id: 2, title: 'Payment Received', message: 'Payment received for booking', read: true, date: '2025-08-30' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/notifications' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Notification marked as read'
      });
    }

    if (req.url === '/api/v1/admin/financial-reports' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          monthlyRevenue: 8500.00,
          totalBookings: 320,
          averageBookingValue: 26.56,
          topVenues: ['Main Hall', 'Swimming Pool']
        }
      });
    }

    if (req.url === '/api/v1/admin/system-config' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          maintenanceMode: false,
          emailNotifications: true,
          smsNotifications: false
        }
      });
    }

    if (req.url === '/api/v1/admin/audit-logs' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, action: 'User Login', user: 'admin@bookon.com', timestamp: '2025-08-31T10:00:00Z' },
          { id: 2, action: 'Booking Created', user: 'parent@bookon.com', timestamp: '2025-08-31T09:30:00Z' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/bulk-user-update' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Bulk user update completed successfully'
      });
    }

    if (req.url === '/api/v1/admin/email-templates' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Welcome Email', subject: 'Welcome to BookOn', status: 'active' },
          { id: 2, name: 'Booking Confirmation', subject: 'Your booking is confirmed', status: 'active' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/broadcast-message' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Broadcast message sent successfully'
      });
    }

    if (req.url === '/api/v1/admin/export/history' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, type: 'bookings', date: '2025-08-31', status: 'completed' },
          { id: 2, type: 'users', date: '2025-08-30', status: 'completed' }
        ]
      });
    }

    if (req.url === '/api/v1/admin/export' && req.method === 'GET') {
      return res.json({
        success: true,
        message: 'Export completed successfully'
      });
    }

    if (req.url === '/api/v1/admin/export/schedule' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, type: 'daily', schedule: '0 0 * * *', status: 'active' },
          { id: 2, type: 'weekly', schedule: '0 0 * * 0', status: 'active' }
        ]
      });
    }

    // Handle venue routes
    if (req.url === '/api/v1/venues' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Main Hall', description: 'Large multipurpose hall', capacity: 100 },
          { id: 2, name: 'Swimming Pool', description: 'Olympic size swimming pool', capacity: 30 }
        ]
      });
    }

    if (req.url === '/api/v1/venues' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Venue created successfully'
      });
    }

    if (req.url === '/api/v1/venues' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Venue updated successfully'
      });
    }

    if (req.url === '/api/v1/venues' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Venue deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/venues\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          name: 'Main Hall',
          description: 'Large multipurpose hall',
          capacity: 100,
          status: 'active'
        }
      });
    }

    if (req.url.match(/^\/api\/v1\/venues\/\d+\/activities$/) && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Swimming Class', description: 'Learn to swim' },
          { id: 2, name: 'Art Workshop', description: 'Creative art sessions' }
        ]
      });
    }

    // Handle activity routes
    if (req.url === '/api/v1/activities' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Swimming Class', description: 'Learn to swim', venue: 'Swimming Pool' },
          { id: 2, name: 'Art Workshop', description: 'Creative art sessions', venue: 'Main Hall' }
        ]
      });
    }

    if (req.url === '/api/v1/activities' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Activity created successfully'
      });
    }

    if (req.url === '/api/v1/activities' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Activity updated successfully'
      });
    }

    if (req.url === '/api/v1/activities' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Activity deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/activities\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          name: 'Swimming Class',
          description: 'Learn to swim',
          venue: 'Swimming Pool',
          status: 'active'
        }
      });
    }

    if (req.url.match(/^\/api\/v1\/activities\?venueId=\d+$/) && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Swimming Class', description: 'Learn to swim' },
          { id: 2, name: 'Art Workshop', description: 'Creative art sessions' }
        ]
      });
    }

    // Handle children routes
    if (req.url === '/api/v1/children' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'John Doe', age: 8, parent: 'parent@bookon.com' },
          { id: 2, name: 'Jane Doe', age: 10, parent: 'parent@bookon.com' }
        ]
      });
    }

    if (req.url === '/api/v1/children' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Child added successfully'
      });
    }

    if (req.url === '/api/v1/children' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Child updated successfully'
      });
    }

    if (req.url === '/api/v1/children' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Child deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/children\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          name: 'John Doe',
          age: 8,
          parent: 'parent@bookon.com',
          status: 'active'
        }
      });
    }

    // Handle booking routes
    if (req.url === '/api/v1/bookings' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, activity: 'Swimming Class', child: 'John Doe', status: 'confirmed' },
          { id: 2, activity: 'Art Workshop', child: 'Jane Doe', status: 'pending' }
        ]
      });
    }

    if (req.url === '/api/v1/bookings' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Booking created successfully'
      });
    }

    if (req.url === '/api/v1/bookings' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Booking updated successfully'
      });
    }

    if (req.url === '/api/v1/bookings' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/bookings\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          activity: 'Swimming Class',
          child: 'John Doe',
          status: 'confirmed',
          date: '2025-08-31'
        }
      });
    }

    // Handle payment routes
    if (req.url === '/api/v1/payments/create-intent' && req.method === 'POST') {
      return res.json({
        success: true,
        data: {
          clientSecret: 'mock-client-secret'
        }
      });
    }

    // Handle widget routes
    if (req.url === '/api/v1/widget-config' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, name: 'Main Widget', status: 'active', activityId: 1 },
          { id: 2, name: 'Secondary Widget', status: 'inactive', activityId: 2 }
        ]
      });
    }

    if (req.url === '/api/v1/widget-config' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Widget config created successfully'
      });
    }

    if (req.url === '/api/v1/widget-config' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Widget config updated successfully'
      });
    }

    if (req.url === '/api/v1/widget-config' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Widget config deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/widget-config\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          name: 'Main Widget',
          status: 'active',
          activityId: 1
        }
      });
    }

    if (req.url.match(/^\/api\/v1\/widget-config\/\d+\/toggle$/) && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Widget status toggled successfully'
      });
    }

    if (req.url === '/api/v1/widget/performance' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          totalBookings: 45,
          conversionRate: 0.75,
          averageSessionTime: 120
        }
      });
    }

    if (req.url === '/api/v1/widget/analytics' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Analytics recorded successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/widget\/activity\/\d+$/) && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          id: 1,
          name: 'Swimming Class',
          description: 'Learn to swim',
          price: 25.00
        }
      });
    }

    // Handle register routes
    if (req.url === '/api/v1/registers' && req.method === 'GET') {
      return res.json({
        success: true,
        data: [
          { id: 1, activity: 'Swimming Class', date: '2025-08-31', status: 'active' },
          { id: 2, activity: 'Art Workshop', date: '2025-08-30', status: 'completed' }
        ]
      });
    }

    if (req.url === '/api/v1/registers' && req.method === 'POST') {
      return res.json({
        success: true,
        message: 'Register created successfully'
      });
    }

    if (req.url === '/api/v1/registers' && req.method === 'PUT') {
      return res.json({
        success: true,
        message: 'Register updated successfully'
      });
    }

    if (req.url === '/api/v1/registers' && req.method === 'DELETE') {
      return res.json({
        success: true,
        message: 'Register deleted successfully'
      });
    }

    if (req.url.match(/^\/api\/v1\/registers\/\d+$/) && req.method === 'GET') {
      const id = req.url.split('/').pop();
      return res.json({
        success: true,
        data: {
          id: parseInt(id),
          activity: 'Swimming Class',
          date: '2025-08-31',
          status: 'active'
        }
      });
    }

    if (req.url.match(/^\/api\/v1\/registers\/\d+\/export\/csv$/) && req.method === 'GET') {
      return res.json({
        success: true,
        message: 'CSV export completed successfully'
      });
    }
    
    // 404 for unknown routes
    res.status(404).json({ error: 'Not found', path: req.url });
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

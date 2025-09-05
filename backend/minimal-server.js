const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Minimal backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock login endpoint
app.post('/api/mock-login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Mock login attempt:', { email, hasPassword: !!password });
    
    if (email === 'test@bookon.com' || email === 'admin@bookon.com') {
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        role: email === 'admin@bookon.com' ? 'admin' : 'parent',
        isActive: true
      };

      // Generate simple tokens
      const accessToken = 'mock-access-token-' + Date.now();
      const refreshToken = 'mock-refresh-token-' + Date.now();

      console.log('Mock login successful:', mockUser.email);

      return res.json({
        success: true,
        message: 'Login successful (mock mode)',
        data: {
          user: mockUser,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      });
    }
  } catch (error) {
    console.error('Mock login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// Mock admin stats endpoint
app.get('/api/v1/admin/stats', (req, res) => {
  try {
    console.log('Admin stats request received');
    
    const mockStats = {
      success: true,
      data: {
        totalUsers: 1250,
        totalActivities: 45,
        totalVenues: 12,
        totalBookings: 3420,
        totalRevenue: 125000,
        monthlyStats: {
          newUsers: 45,
          newBookings: 280,
          revenue: 12500
        },
        recentActivity: [
          {
            id: '1',
            type: 'booking',
            message: 'New booking created for Swimming Class',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'user',
            message: 'New user registered: john.doe@example.com',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            type: 'payment',
            message: 'Payment received: £45.00',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      }
    };

    return res.json(mockStats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch admin statistics',
        code: 'ADMIN_STATS_ERROR',
      },
    });
  }
});

// Mock admin users endpoint
app.get('/api/v1/admin/users', (req, res) => {
  try {
    console.log('Admin users request received');
    
    const mockUsers = {
      success: true,
      data: {
        users: [
          {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'parent',
            isActive: true,
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'parent',
            isActive: true,
            createdAt: '2024-01-14T14:20:00Z'
          },
          {
            id: '3',
            email: 'admin@bookon.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isActive: true,
            createdAt: '2024-01-01T09:00:00Z'
          }
        ],
        total: 3,
        page: 1,
        limit: 10
      }
    };

    return res.json(mockUsers);
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch users',
        code: 'ADMIN_USERS_ERROR',
      },
    });
  }
});

// Mock admin activities endpoint
app.get('/api/v1/admin/activities', (req, res) => {
  try {
    console.log('Admin activities request received');
    
    const mockActivities = {
      success: true,
      data: {
        activities: [
          {
            id: '1',
            title: 'Swimming Class',
            description: 'Learn to swim with professional instructors',
            venue: 'Community Pool',
            capacity: 20,
            price: 25.00,
            isActive: true
          },
          {
            id: '2',
            title: 'Football Training',
            description: 'Youth football training sessions',
            venue: 'Sports Complex',
            capacity: 30,
            price: 15.00,
            isActive: true
          },
          {
            id: '3',
            title: 'Art Workshop',
            description: 'Creative art classes for children',
            venue: 'Art Center',
            capacity: 15,
            price: 35.00,
            isActive: true
          }
        ],
        total: 3
      }
    };

    return res.json(mockActivities);
  } catch (error) {
    console.error('Admin activities error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch activities',
        code: 'ADMIN_ACTIVITIES_ERROR',
      },
    });
  }
});

// Mock admin venues endpoint
app.get('/api/v1/admin/venues', (req, res) => {
  try {
    console.log('Admin venues request received');
    
    const mockVenues = {
      success: true,
      data: {
        venues: [
          {
            id: '1',
            name: 'Community Pool',
            address: '123 Main Street',
            capacity: 50,
            isActive: true
          },
          {
            id: '2',
            name: 'Sports Complex',
            address: '456 Oak Avenue',
            capacity: 100,
            isActive: true
          },
          {
            id: '3',
            name: 'Art Center',
            address: '789 Pine Road',
            capacity: 30,
            isActive: true
          }
        ],
        total: 3
      }
    };

    return res.json(mockVenues);
  } catch (error) {
    console.error('Admin venues error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch venues',
        code: 'ADMIN_VENUES_ERROR',
      },
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

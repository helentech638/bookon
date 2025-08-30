// Main API entry point for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BookOn API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/health', '/api/v1/auth/login']
  });
});

// Simple login endpoint for testing
app.post('/api/v1/auth/login', (req, res) => {
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
          role: 'admin',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    });
  }
  
  res.status(401).json({
    success: false,
    error: {
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { 
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// Export for Vercel serverless function
module.exports = (req, res) => {
  // Handle the request through Express
  app(req, res);
};

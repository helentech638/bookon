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
        endpoints: ['/ping', '/health', '/api/v1/auth/login']
      });
    }
    
    // Handle login endpoint
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
    
    // 404 for unknown routes
    res.status(404).json({ error: 'Not found', path: req.url });
    
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

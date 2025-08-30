// Simple test file to check if Vercel can run basic Node.js
console.log('🚀 Simple test file loaded');

module.exports = (req, res) => {
  console.log('📝 Request received:', req.method, req.url);
  
  if (req.url === '/ping') {
    return res.json({ message: 'pong', timestamp: new Date().toISOString() });
  }
  
  if (req.url === '/health') {
    return res.json({ status: 'OK', timestamp: new Date().toISOString() });
  }
  
  if (req.url === '/') {
    return res.json({ 
      message: 'Simple test backend working!',
      timestamp: new Date().toISOString(),
      endpoints: ['/ping', '/health']
    });
  }
  
  res.status(404).json({ error: 'Not found', path: req.url });
};

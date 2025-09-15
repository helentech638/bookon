const https = require('https');

// Test with a mock JWT token to see what happens
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function testWithAuth(path) {
  return new Promise((resolve, reject) => {
    const url = `https://bookon-api.vercel.app/api/v1${path}`;
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BookOn-Test/1.0'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          path: path,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function testAuthEndpoints() {
  console.log('🔍 Testing authenticated endpoints...\n');
  
  const endpoints = [
    '/admin/stats',
    '/admin/venues', 
    '/admin/activities',
    '/admin/recent-bookings',
    '/dashboard/stats',
    '/dashboard/recent-activities',
    '/dashboard/snapshot',
    '/wallet/balance',
    '/finance/summary',
    '/activities/upcoming'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testWithAuth(endpoint);
      console.log(`${endpoint}: ${result.status} ${result.status === 200 ? '✅' : '❌'}`);
      
      if (result.status === 500) {
        console.log(`   🚨 500 Error Response:`);
        console.log(`   ${result.data}`);
      } else if (result.status === 401) {
        console.log(`   🔒 Auth required (expected)`);
      } else if (result.status !== 200) {
        console.log(`   📄 Response: ${result.data}`);
      }
      
      console.log(''); // Empty line for readability
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

testAuthEndpoints().catch(console.error);

const https = require('https');

function checkEndpoint(path) {
  return new Promise((resolve, reject) => {
    const url = `https://bookon-api.vercel.app/api/v1${path}`;
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BookOn-Check/1.0'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          path: path,
          data: data.substring(0, 200) // First 200 chars
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

async function checkDeployment() {
  console.log('🔍 Checking Vercel deployment...\n');
  
  const endpoints = [
    '/health',
    '/admin/stats', 
    '/dashboard/stats',
    '/wallet/balance',
    '/activities/upcoming'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await checkEndpoint(endpoint);
      console.log(`${endpoint}: ${result.status} ${result.status === 200 ? '✅' : '❌'}`);
      if (result.status !== 200 && result.data) {
        console.log(`   Response: ${result.data}`);
      }
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}

checkDeployment().catch(console.error);

const fetch = require('node-fetch');

// Test the dashboard endpoints
async function testDashboardEndpoints() {
  const baseUrl = 'https://bookon-api.vercel.app/api/v1';
  
  // You'll need to replace this with a valid token
  const token = 'YOUR_TOKEN_HERE';
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const endpoints = [
    '/dashboard/stats',
    '/dashboard/profile', 
    '/dashboard/recent-activities',
    '/wallet/balance'
  ];

  console.log('Testing Dashboard Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
    console.log('---');
  }
}

// Run the test
testDashboardEndpoints().catch(console.error);

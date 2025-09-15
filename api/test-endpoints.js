#!/usr/bin/env node

const https = require('https');

const API_BASE_URL = 'https://bookon-api.vercel.app/api/v1';

// Test specific failing endpoints
const testEndpoints = [
  '/health',
  '/health/database',
  '/admin/stats',
  '/admin/venues', 
  '/admin/activities',
  '/admin/recent-bookings',
  '/dashboard/stats',
  '/dashboard/recent-activities',
  '/dashboard/snapshot',
  '/wallet/balance',
  '/finance/summary',
  '/activities/upcoming',
  '/notifications'
];

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BookOn-API-Test/1.0',
        ...headers
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`\n🔍 Testing: ${endpoint}`);
    const response = await makeRequest(url);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    
    if (response.status === 200) {
      try {
        const jsonData = JSON.parse(response.data);
        console.log(`   ✅ Success: ${jsonData.success ? 'true' : 'false'}`);
        if (jsonData.data) {
          console.log(`   📊 Data keys: ${Object.keys(jsonData.data).join(', ')}`);
        }
        if (jsonData.error) {
          console.log(`   ⚠️  Error: ${jsonData.error.message}`);
        }
      } catch (parseError) {
        console.log(`   ⚠️  Non-JSON response (${response.data.length} chars)`);
        if (response.data.length < 200) {
          console.log(`   📄 Response: ${response.data.substring(0, 100)}...`);
        }
      }
    } else {
      console.log(`   ❌ Error: ${response.status}`);
      if (response.data.length < 500) {
        try {
          const errorData = JSON.parse(response.data);
          console.log(`   📄 Error: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
        } catch {
          console.log(`   📄 Response: ${response.data}`);
        }
      }
    }
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 BookOn API Endpoint Test');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ All tests completed');
}

// Run the tests
runTests().catch(console.error);

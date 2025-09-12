// Test backend functionality
const https = require('https');

const API_BASE = 'https://bookon-api.vercel.app/api/v1';

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBackend() {
  try {
    console.log('🔍 Testing backend functionality...');
    
    // Test 1: Health check
    console.log('\n📊 Step 1: Testing health endpoint...');
    const healthResult = await makeRequest(`${API_BASE}/health`, {
      method: 'GET'
    });
    console.log('Health status:', healthResult.status);
    console.log('Health response:', healthResult.data);
    
    // Test 2: Create admin user
    console.log('\n👤 Step 2: Creating admin user...');
    const createResult = await makeRequest(`${API_BASE}/auth/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@bookon.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User'
    });
    
    console.log('Create admin status:', createResult.status);
    console.log('Create admin response:', createResult.data);
    
    // Test 3: Try to login
    console.log('\n🔑 Step 3: Testing admin login...');
    const loginResult = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'admin@bookon.com',
      password: 'admin123'
    });
    
    console.log('Login status:', loginResult.status);
    console.log('Login response:', loginResult.data);
    
    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('\n✅ BACKEND IS WORKING!');
      console.log('Admin credentials:');
      console.log('  Email: admin@bookon.com');
      console.log('  Password: admin123');
      console.log('  Role:', loginResult.data.data?.user?.role);
    } else {
      console.log('\n❌ BACKEND HAS ISSUES');
      console.log('Login Status:', loginResult.status);
      console.log('Login Error:', loginResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
  }
}

testBackend();
// Test login directly
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

async function testLogin() {
  try {
    console.log('🔍 Testing login directly...');
    
    // Test 1: Create admin user
    console.log('\n👤 Creating admin user...');
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
    
    // Test 2: Try to login
    console.log('\n🔑 Testing admin login...');
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
      console.log('\n✅ LOGIN IS WORKING!');
      console.log('Admin credentials:');
      console.log('  Email: admin@bookon.com');
      console.log('  Password: admin123');
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Status:', loginResult.status);
      console.log('Error:', loginResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();

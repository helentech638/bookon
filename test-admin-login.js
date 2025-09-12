// Test admin login script
const fetch = require('node-fetch');

const API_BASE = 'https://bookon-cw70ovrtc-bookonapp.vercel.app/api/v1';

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    // First, try to create admin user if it doesn't exist
    console.log('📝 Creating admin user...');
    const createResponse = await fetch(`${API_BASE}/auth/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@bookon.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User'
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Create admin result:', createResult);
    
    // Now try to login
    console.log('🔑 Attempting admin login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@bookon.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (loginResult.success) {
      console.log('✅ Admin login successful!');
      console.log('Admin credentials:');
      console.log('  Email: admin@bookon.com');
      console.log('  Password: admin123');
      console.log('  Role:', loginResult.data.user.role);
      console.log('  Token:', loginResult.data.token ? 'Present' : 'Missing');
    } else {
      console.log('❌ Admin login failed:', loginResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  }
}

testAdminLogin();

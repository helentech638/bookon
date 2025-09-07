const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📊 Environment:', process.env.NODE_ENV);
  
  // Test with DATABASE_DIRECT_URL first
  if (process.env.DATABASE_DIRECT_URL) {
    console.log('🔌 Testing DATABASE_DIRECT_URL...');
    const urlParts = process.env.DATABASE_DIRECT_URL.split('@');
    if (urlParts.length > 1) {
      console.log('📊 Database host:', urlParts[1]);
    }
    
    const client = new Client({
      connectionString: process.env.DATABASE_DIRECT_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log('✅ DATABASE_DIRECT_URL connection successful');
      
      const result = await client.query('SELECT version()');
      console.log('📊 PostgreSQL version:', result.rows[0].version);
      
      // Test if tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name));
      
      await client.end();
      return true;
    } catch (error) {
      console.error('❌ DATABASE_DIRECT_URL connection failed:', error.message);
      await client.end().catch(() => {});
    }
  }
  
  // Test with DATABASE_URL as fallback
  if (process.env.DATABASE_URL) {
    console.log('🔌 Testing DATABASE_URL...');
    const urlParts = process.env.DATABASE_URL.split('@');
    if (urlParts.length > 1) {
      console.log('📊 Database host:', urlParts[1]);
    }
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log('✅ DATABASE_URL connection successful');
      
      const result = await client.query('SELECT version()');
      console.log('📊 PostgreSQL version:', result.rows[0].version);
      
      await client.end();
      return true;
    } catch (error) {
      console.error('❌ DATABASE_URL connection failed:', error.message);
      await client.end().catch(() => {});
    }
  }
  
  console.log('❌ No valid database connection found');
  return false;
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

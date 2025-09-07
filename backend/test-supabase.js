const { Client } = require('pg');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection with actual URLs...');
  
  // Test DATABASE_DIRECT_URL - Try session pooler on port 5432
  const directUrl = "postgresql://postgres.nwshehrocdwtgzdowfta:Supabasebookon@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
  console.log('🔌 Testing DATABASE_DIRECT_URL (session pooler)...');
  console.log('📊 Host: aws-1-ap-southeast-1.pooler.supabase.com:5432');
  
  const directClient = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await directClient.connect();
    console.log('✅ DATABASE_DIRECT_URL connection successful!');
    
    // Test basic query
    const result = await directClient.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Check if tables exist
    const tablesResult = await directClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check if users table has data
    if (tablesResult.rows.some(r => r.table_name === 'users')) {
      const usersResult = await directClient.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users count:', usersResult.rows[0].count);
      
      // Check for admin user
      const adminResult = await directClient.query("SELECT id, email, role FROM users WHERE email = 'admin@bookon.com'");
      if (adminResult.rows.length > 0) {
        console.log('👑 Admin user found:', adminResult.rows[0]);
      } else {
        console.log('❌ No admin user found with email admin@bookon.com');
      }
    }
    
    await directClient.end();
    return true;
  } catch (error) {
    console.error('❌ DATABASE_DIRECT_URL connection failed:', error.message);
    console.error('🔍 Error details:', error);
    await directClient.end().catch(() => {});
  }
  
  // Test DATABASE_URL (pooler)
  const poolerUrl = "postgresql://postgres.nwshehrocdwtgzdowfta:Supabasebookon@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
  console.log('\n🔌 Testing DATABASE_URL (pooler)...');
  console.log('📊 Host: aws-1-ap-southeast-1.pooler.supabase.com:6543');
  
  const poolerClient = new Client({
    connectionString: poolerUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await poolerClient.connect();
    console.log('✅ DATABASE_URL (pooler) connection successful!');
    
    const result = await poolerClient.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    await poolerClient.end();
    return true;
  } catch (error) {
    console.error('❌ DATABASE_URL (pooler) connection failed:', error.message);
    console.error('🔍 Error details:', error);
    await poolerClient.end().catch(() => {});
  }
  
  console.log('❌ No valid Supabase connection found');
  return false;
}

testSupabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

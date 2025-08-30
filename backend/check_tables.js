const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'bookon_user',
    password: process.env.DB_PASSWORD || 'bookon_password',
    database: process.env.DB_NAME || 'bookon',
  }
});

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables...\n');
    
    // Check if tables exist
    const tables = ['venues', 'activities', 'children', 'bookings', 'payments'];
    
    for (const table of tables) {
      try {
        const exists = await db.schema.hasTable(table);
        console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        
        if (exists) {
          const count = await db(table).count('* as count');
          console.log(`   └─ Records: ${count[0].count}`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      }
    }
    
    console.log('\n📊 Current migration status:');
    const migrations = await db.migrate.list();
    console.log('Completed:', migrations[1].length);
    console.log('Pending:', migrations[0].length);
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await db.destroy();
  }
}

checkTables();

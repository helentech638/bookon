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

async function cleanupTables() {
  try {
    console.log('🧹 Cleaning up partially created tables...\n');
    
    // Drop tables in reverse dependency order
    const tables = ['payments', 'bookings', 'children', 'activities', 'venues'];
    
    for (const table of tables) {
      try {
        const exists = await db.schema.hasTable(table);
        if (exists) {
          console.log(`🗑️  Dropping table: ${table}`);
          await db.schema.dropTable(table);
          console.log(`✅ Dropped: ${table}`);
        } else {
          console.log(`ℹ️  Table ${table} doesn't exist, skipping`);
        }
      } catch (error) {
        console.log(`❌ Error dropping ${table}: ${error.message}`);
      }
    }
    
    console.log('\n✨ Cleanup complete! Ready for fresh migration.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await db.destroy();
  }
}

cleanupTables();

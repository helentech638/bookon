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

async function inspectTables() {
  try {
    console.log('🔍 Inspecting table structures...\n');
    
    const tables = ['venues', 'activities', 'children', 'bookings', 'payments'];
    
    for (const table of tables) {
      try {
        console.log(`📋 Table: ${table}`);
        console.log('Columns:');
        
        const columns = await db.raw(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ? 
          ORDER BY ordinal_position
        `, [table]);
        
        columns.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`);
        });
        
        console.log('');
      } catch (error) {
        console.log(`❌ Error inspecting ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error inspecting tables:', error.message);
  } finally {
    await db.destroy();
  }
}

inspectTables();

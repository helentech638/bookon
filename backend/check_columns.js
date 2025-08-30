const { db } = require('./src/utils/database');

async function checkColumns() {
  try {
    console.log('Checking bookings table columns...');
    const bookingsColumns = await db('bookings').columnInfo();
    console.log('Bookings columns:', Object.keys(bookingsColumns));
    
    console.log('\nChecking payments table columns...');
    const paymentsColumns = await db('payments').columnInfo();
    console.log('Payments columns:', Object.keys(paymentsColumns));
    
    console.log('\nChecking activities table columns...');
    const activitiesColumns = await db('activities').columnInfo();
    console.log('Activities columns:', Object.keys(activitiesColumns));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

checkColumns();

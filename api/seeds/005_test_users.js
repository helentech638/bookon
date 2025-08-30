/**
 * Seed: Test Users
 * Creates test users for development and testing
 */

exports.seed = async function(knex) {
  // Check if users already exist
  const existingUsers = await knex('users').select('email');
  const existingEmails = existingUsers.map(u => u.email);
  
  // Only insert if users don't exist
  if (!existingEmails.includes('test@example.com')) {
    await knex('users').insert([
      {
        email: 'test@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Ge', // password: test123
        role: 'parent',
        isActive: true,
        email_verified: true
      },
      {
        email: 'admin@bookon.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Ge', // password: test123
        role: 'admin',
        isActive: true,
        email_verified: true
      },
      {
        email: 'staff@bookon.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Ge', // password: test123
        role: 'staff',
        isActive: true,
        email_verified: true
      }
    ]);
    
    console.log('✅ Test users created successfully');
  } else {
    console.log('ℹ️  Test users already exist, skipping...');
  }
};

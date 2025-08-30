/**
 * Seed: Venue Staff
 * Creates sample venue staff assignments for testing
 */

exports.seed = async function(knex) {
  // Check if venue staff already exist
  const existingStaff = await knex('venue_staff').select('id');
  
  if (existingStaff.length > 0) {
    console.log('Venue staff already exist, skipping seed');
    return;
  }

  // Get sample venues and users
  const venues = await knex('venues').select('id').limit(2);
  const users = await knex('users').whereIn('role', ['staff', 'admin']).select('id').limit(3);

  if (venues.length === 0 || users.length === 0) {
    console.log('No venues or users found, skipping venue staff seed');
    return;
  }

  // Create venue staff assignments
  const venueStaff = [];
  
  // Assign staff to venues
  for (let i = 0; i < Math.min(venues.length, users.length); i++) {
    venueStaff.push({
      venue_id: venues[i].id,
      user_id: users[i].id,
      role: users[i].role === 'admin' ? 'manager' : 'staff',
      is_active: true,
      created_by: users[0].id // Use first user as creator
    });
  }

  // Insert venue staff
  await knex('venue_staff').insert(venueStaff);
  
  console.log(`Created ${venueStaff.length} venue staff assignments`);
};

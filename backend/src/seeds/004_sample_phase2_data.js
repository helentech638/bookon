/**
 * Seed: Sample Phase 2 Data
 * Populates venues, activities, and other tables with realistic data for testing
 * Matches the actual table structure from 001_initial_schema.js
 */

exports.seed = async function(knex) {
  // Clear existing data (in reverse dependency order)
  await knex('payments').del();
  await knex('bookings').del();
  await knex('children').del();
  await knex('activities').del();
  await knex('venues').del();

  // Insert sample venues
  const venues = await knex('venues').insert([
    {
      name: 'Community Sports Centre',
      description: 'Modern sports facility with multiple courts and training areas',
      address: '123 Sports Lane, Manchester, M1 1AA',
      city: 'Manchester',
      state: 'England',
      zip_code: 'M1 1AA',
      country: 'UK',
      phone: '0161 123 4567',
      email: 'info@sportscentre.com',
      capacity: 100,
      amenities: JSON.stringify(['Football pitch', 'Basketball court', 'Swimming pool', 'Gym']),
      images: JSON.stringify(['sports_centre_1.jpg', 'sports_centre_2.jpg']),
      is_active: true
    },
    {
      name: 'Riverside Activity Park',
      description: 'Outdoor adventure park with climbing walls and zip lines',
      address: '456 River Road, Manchester, M2 2BB',
      city: 'Manchester',
      state: 'England',
      zip_code: 'M2 2BB',
      country: 'UK',
      phone: '0161 234 5678',
      email: 'hello@riversidepark.com',
      capacity: 50,
      amenities: JSON.stringify(['Climbing walls', 'Zip lines', 'Adventure course', 'Picnic area']),
      images: JSON.stringify(['riverside_1.jpg', 'riverside_2.jpg']),
      is_active: true
    },
    {
      name: 'Creative Arts Studio',
      description: 'Art and craft studio for children and families',
      address: '789 Art Street, Manchester, M3 3CC',
      city: 'Manchester',
      state: 'England',
      zip_code: 'M3 3CC',
      country: 'UK',
      phone: '0161 345 6789',
      email: 'create@artsstudio.com',
      capacity: 30,
      amenities: JSON.stringify(['Pottery wheels', 'Art supplies', 'Exhibition space', 'Workshop area']),
      images: JSON.stringify(['arts_studio_1.jpg', 'arts_studio_2.jpg']),
      is_active: true
    },
    {
      name: 'Science Discovery Lab',
      description: 'Interactive science museum and learning center',
      address: '321 Science Avenue, Manchester, M4 4DD',
      city: 'Manchester',
      state: 'England',
      zip_code: 'M4 4DD',
      country: 'UK',
      phone: '0161 456 7890',
      email: 'discover@sciencelab.com',
      capacity: 80,
      amenities: JSON.stringify(['Science exhibits', 'Laboratory', 'Planetarium', 'Gift shop']),
      images: JSON.stringify(['science_lab_1.jpg', 'science_lab_2.jpg']),
      is_active: true
    }
  ]).returning('*');

  // Insert sample activities
  const activities = await knex('activities').insert([
    {
      name: 'Football Training for Kids',
      description: 'Weekly football training sessions for children aged 6-12. Learn basic skills, teamwork, and have fun!',
      category: 'Sports',
      venue_id: venues[0].id,
      max_capacity: 20,
      current_capacity: 0,
      price: 15.00,
      duration: 90, // 90 minutes
      age_range: JSON.stringify({ min: 6, max: 12 }),
      skill_level: 'Beginner',
      instructor: 'Coach Mike Johnson',
      schedule: JSON.stringify([
        { day: 'Saturday', time: '10:00', frequency: 'weekly' }
      ]),
      tags: JSON.stringify(['football', 'sports', 'teamwork', 'fitness']),
      is_active: true
    },
    {
      name: 'Rock Climbing Adventure',
      description: 'Safe rock climbing experience for children aged 8-14. All equipment provided, qualified instructors.',
      category: 'Adventure',
      venue_id: venues[1].id,
      max_capacity: 12,
      current_capacity: 0,
      price: 25.00,
      duration: 120, // 120 minutes
      age_range: JSON.stringify({ min: 8, max: 14 }),
      skill_level: 'All Levels',
      instructor: 'Sarah Williams',
      schedule: JSON.stringify([
        { day: 'Sunday', time: '14:00', frequency: 'weekly' }
      ]),
      tags: JSON.stringify(['climbing', 'adventure', 'strength', 'confidence']),
      is_active: true
    },
    {
      name: 'Pottery and Clay Art',
      description: 'Creative pottery sessions where children can make their own clay creations. Great for developing fine motor skills.',
      category: 'Arts & Crafts',
      venue_id: venues[2].id,
      max_capacity: 15,
      current_capacity: 0,
      price: 18.00,
      duration: 90, // 90 minutes
      age_range: JSON.stringify({ min: 5, max: 12 }),
      skill_level: 'All Levels',
      instructor: 'Emma Davis',
      schedule: JSON.stringify([
        { day: 'Wednesday', time: '13:00', frequency: 'weekly' }
      ]),
      tags: JSON.stringify(['pottery', 'art', 'creativity', 'fine motor skills']),
      is_active: true
    },
    {
      name: 'Science Experiments Workshop',
      description: 'Hands-on science experiments for curious minds aged 7-13. Safe, educational, and lots of fun!',
      category: 'Education',
      venue_id: venues[3].id,
      max_capacity: 18,
      current_capacity: 0,
      price: 20.00,
      duration: 90, // 90 minutes
      age_range: JSON.stringify({ min: 7, max: 13 }),
      skill_level: 'All Levels',
      instructor: 'Dr. James Wilson',
      schedule: JSON.stringify([
        { day: 'Friday', time: '15:00', frequency: 'weekly' }
      ]),
      tags: JSON.stringify(['science', 'experiments', 'education', 'curiosity']),
      is_active: true
    },
    {
      name: 'Swimming Lessons',
      description: 'Learn to swim with qualified instructors. Different levels available from beginners to advanced.',
      category: 'Sports',
      venue_id: venues[0].id,
      max_capacity: 8,
      current_capacity: 0,
      price: 22.00,
      duration: 60, // 60 minutes
      age_range: JSON.stringify({ min: 4, max: 12 }),
      skill_level: 'All Levels',
      instructor: 'Lisa Thompson',
      schedule: JSON.stringify([
        { day: 'Tuesday', time: '16:00', frequency: 'weekly' },
        { day: 'Thursday', time: '16:00', frequency: 'weekly' }
      ]),
      tags: JSON.stringify(['swimming', 'water safety', 'fitness', 'coordination']),
      is_active: true
    }
  ]).returning('*');

  // Get a sample user to associate children with
  const users = await knex('users').select('id').limit(1);
  if (users.length > 0) {
    const userId = users[0].id;

    // Insert sample children
    const children = await knex('children').insert([
      {
        user_id: userId,
        first_name: 'Emma',
        last_name: 'Johnson',
        date_of_birth: '2015-03-15',
        gender: 'female',
        medical_info: 'No medical conditions',
        emergency_contact: JSON.stringify({
          name: 'Mum',
          phone: '07700 900123',
          relationship: 'Parent'
        }),
        is_active: true
      },
      {
        user_id: userId,
        first_name: 'Liam',
        last_name: 'Johnson',
        date_of_birth: '2017-07-22',
        gender: 'male',
        medical_info: 'Allergic to peanuts - carries EpiPen',
        emergency_contact: JSON.stringify({
          name: 'Mum',
          phone: '07700 900123',
          relationship: 'Parent'
        }),
        is_active: true
      }
    ]).returning('*');

    // Insert sample bookings
    const bookings = await knex('bookings').insert([
      {
        user_id: userId,
        activity_id: activities[0].id,
        venue_id: venues[0].id,
        child_id: children[0].id,
        status: 'confirmed',
        payment_status: 'paid',
        amount: 15.00,
        currency: 'GBP',
        booking_date: new Date(),
        activity_date: '2024-09-21',
        activity_time: '10:00:00',
        notes: 'Emma is excited about football training!'
      },
      {
        user_id: userId,
        activity_id: activities[2].id,
        venue_id: venues[2].id,
        child_id: children[0].id,
        status: 'pending',
        payment_status: 'pending',
        amount: 18.00,
        currency: 'GBP',
        booking_date: new Date(),
        activity_date: '2024-09-25',
        activity_time: '13:00:00',
        notes: 'Pottery session for Emma'
      },
      {
        user_id: userId,
        activity_id: activities[1].id,
        venue_id: venues[1].id,
        child_id: children[1].id,
        status: 'confirmed',
        payment_status: 'paid',
        amount: 25.00,
        currency: 'GBP',
        booking_date: new Date(),
        activity_date: '2024-09-22',
        activity_time: '14:00:00',
        notes: 'Liam loves climbing!'
      }
    ]).returning('*');

    // Insert sample payments
    await knex('payments').insert([
      {
        booking_id: bookings[0].id,
        stripe_payment_intent_id: 'pi_sample_001',
        amount: 15.00,
        currency: 'GBP',
        status: 'succeeded',
        payment_method: JSON.stringify({
          type: 'card',
          brand: 'visa',
          last4: '4242'
        }),
        paid_at: new Date()
      },
      {
        booking_id: bookings[2].id,
        stripe_payment_intent_id: 'pi_sample_002',
        amount: 25.00,
        currency: 'GBP',
        status: 'succeeded',
        payment_method: JSON.stringify({
          type: 'card',
          brand: 'mastercard',
          last4: '5555'
        }),
        paid_at: new Date()
      }
    ]);
  }

  console.log('✅ Sample data inserted successfully!');
  console.log(`   - ${venues.length} venues created`);
  console.log(`   - ${activities.length} activities created`);
  console.log('   - Sample children, bookings, and payments created');
};

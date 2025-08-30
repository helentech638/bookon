/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('email').unique().notNullable();
      table.string('password_hash').notNullable();
      table.enum('role', ['parent', 'staff', 'admin']).defaultTo('parent');
      table.boolean('is_active').defaultTo(true);
      table.boolean('email_verified').defaultTo(false);
      table.boolean('phone_verified').defaultTo(false);
      table.timestamp('last_login_at');
      table.timestamps(true, true);
    })
    .createTable('user_profiles', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.text('address');
      table.date('date_of_birth');
      table.string('profile_image');
      table.timestamps(true, true);
    })
    .createTable('venues', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.text('address').notNullable();
      table.string('city').notNullable();
      table.string('state').notNullable();
      table.string('zip_code').notNullable();
      table.string('country').defaultTo('USA');
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('phone');
      table.string('email');
      table.string('website');
      table.integer('capacity');
      table.jsonb('amenities');
      table.jsonb('images');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('activities', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.string('category').notNullable();
      table.uuid('venue_id').references('id').inTable('venues').onDelete('CASCADE');
      table.integer('max_capacity').notNullable();
      table.integer('current_capacity').defaultTo(0);
      table.decimal('price', 10, 2).notNullable();
      table.integer('duration').notNullable(); // in minutes
      table.jsonb('age_range'); // { min: 5, max: 15 }
      table.string('skill_level');
      table.string('instructor');
      table.jsonb('schedule'); // array of schedule objects
      table.jsonb('images');
      table.jsonb('tags');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('children', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.date('date_of_birth').notNullable();
      table.enum('gender', ['male', 'female', 'other']);
      table.text('medical_info');
      table.jsonb('emergency_contact');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('bookings', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('activity_id').references('id').inTable('activities').onDelete('CASCADE');
      table.uuid('venue_id').references('id').inTable('venues').onDelete('CASCADE');
      table.uuid('child_id').references('id').inTable('children').onDelete('CASCADE');
      table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed']).defaultTo('pending');
      table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency').defaultTo('USD');
      table.date('booking_date').notNullable();
      table.date('activity_date').notNullable();
      table.time('activity_time').notNullable();
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('payments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
      table.string('stripe_payment_intent_id').unique();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency').defaultTo('USD');
      table.enum('status', ['pending', 'succeeded', 'failed', 'cancelled']).defaultTo('pending');
      table.jsonb('payment_method');
      table.timestamp('paid_at');
      table.timestamps(true, true);
    })
    .createTable('notifications', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.jsonb('metadata');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('payments')
    .dropTableIfExists('bookings')
    .dropTableIfExists('children')
    .dropTableIfExists('activities')
    .dropTableIfExists('venues')
    .dropTableIfExists('user_profiles')
    .dropTableIfExists('users');
};

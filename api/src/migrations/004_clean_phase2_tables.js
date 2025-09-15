/**
 * Migration: Create Phase 2 tables (Clean Version)
 * This migration creates the core tables needed for activities, venues, children, bookings, and payments
 * using proper table existence checks
 */

exports.up = async function(knex) {
  // Create venues table
  if (!(await knex.schema.hasTable('venues'))) {
    await knex.schema.createTable('venues', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.text('description');
      table.string('address', 200).notNullable();
      table.string('city', 50).notNullable();
      table.string('postcode', 10).notNullable();
      table.string('phone', 20);
      table.string('email', 100);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['city']);
      table.index(['is_active']);
    });
  }

  // Create activities table
  if (!(await knex.schema.hasTable('activities'))) {
    await knex.schema.createTable('activities', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title', 100).notNullable();
      table.text('description');
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.integer('capacity').notNullable().defaultTo(1);
      table.decimal('price', 10, 2).notNullable();
      table.uuid('venue_id').references('id').inTable('venues').onDelete('CASCADE');
      table.enum('status', ['draft', 'published', 'cancelled']).defaultTo('draft');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['venue_id']);
      table.index(['start_date']);
      table.index(['status']);
      table.index(['is_active']);
    });
  }

  // Create children table
  if (!(await knex.schema.hasTable('children'))) {
    await knex.schema.createTable('children', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('first_name', 50).notNullable();
      table.string('last_name', 50).notNullable();
      table.date('date_of_birth').notNullable();
      table.string('year_group', 20);
      table.text('allergies');
      table.text('medical_info');
      table.jsonb('emergency_contacts');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['user_id']);
      table.index(['is_active']);
    });
  }

  // Create bookings table
  if (!(await knex.schema.hasTable('bookings'))) {
    await knex.schema.createTable('bookings', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('activity_id').references('id').inTable('activities').onDelete('CASCADE');
      table.uuid('child_id').references('id').inTable('children').onDelete('CASCADE');
      table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed']).defaultTo('pending');
      table.decimal('total_amount', 10, 2).notNullable();
      table.decimal('fee_amount', 10, 2).notNullable().defaultTo(0);
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['user_id']);
      table.index(['activity_id']);
      table.index(['child_id']);
      table.index(['status']);
      table.index(['is_active']);
    });
  }

  // Create payments table
  if (!(await knex.schema.hasTable('payments'))) {
    await knex.schema.createTable('payments', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('stripe_payment_intent_id', 100);
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency', 3).defaultTo('gbp');
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
      table.string('payment_method', 50).defaultTo('stripe');
      table.timestamp('completed_at');
      table.timestamp('refunded_at');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['booking_id']);
      table.index(['user_id']);
      table.index(['stripe_payment_intent_id']);
      table.index(['status']);
      table.index(['is_active']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payments')
    .dropTableIfExists('bookings')
    .dropTableIfExists('children')
    .dropTableIfExists('activities')
    .dropTableIfExists('venues');
};

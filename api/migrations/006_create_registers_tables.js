/**
 * Migration: Create Registers Tables
 * Creates tables for digital registers and attendance tracking
 */

exports.up = function(knex) {
  return knex.schema
    .createTable('registers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('activity_id').notNullable().references('id').inTable('activities').onDelete('CASCADE');
      table.date('date').notNullable();
      table.text('notes');
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('deleted_by').references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      // Indexes
      table.index(['activity_id', 'date']);
      table.index(['date']);
      table.index(['created_by']);
      table.index(['is_active']);
      
      // Unique constraint to prevent duplicate registers for same activity and date
      table.unique(['activity_id', 'date', 'is_active']);
    })
    
    .createTable('register_attendance', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('register_id').notNullable().references('id').inTable('registers').onDelete('CASCADE');
      table.uuid('child_id').notNullable().references('id').inTable('children').onDelete('CASCADE');
      table.enum('status', ['present', 'absent', 'late', 'left_early']).notNullable().defaultTo('present');
      table.text('notes');
      table.uuid('recorded_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('deleted_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      // Indexes
      table.index(['register_id']);
      table.index(['child_id']);
      table.index(['status']);
      table.index(['recorded_by']);
      table.index(['is_active']);
      
      // Unique constraint to prevent duplicate attendance records
      table.unique(['register_id', 'child_id', 'is_active']);
    })
    
    .createTable('venue_staff', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('venue_id').notNullable().references('id').inTable('venues').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('role', ['staff', 'manager']).notNullable().defaultTo('staff');
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
      
      // Indexes
      table.index(['venue_id']);
      table.index(['user_id']);
      table.index(['is_active']);
      
      // Unique constraint to prevent duplicate staff assignments
      table.unique(['venue_id', 'user_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('venue_staff')
    .dropTableIfExists('register_attendance')
    .dropTableIfExists('registers');
};

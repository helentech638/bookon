/**
 * Migration: Create Webhook Events Table
 * Creates table for tracking webhook events and their processing status
 */

exports.up = function(knex) {
  return knex.schema.createTable('webhook_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('event_type').notNullable(); // e.g., 'user.created', 'booking.updated'
    table.string('source').notNullable(); // e.g., 'stripe', 'external', 'internal'
    table.jsonb('data'); // Event payload data
    table.boolean('processed').defaultTo(false); // Whether event was processed successfully
    table.timestamp('processed_at'); // When event was processed
    table.integer('retry_count').defaultTo(0); // Number of retry attempts
    table.text('error'); // Error message if processing failed
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes for better query performance
    table.index(['event_type']);
    table.index(['source']);
    table.index(['processed']);
    table.index(['created_at']);
    table.index(['processed', 'created_at']); // For finding unprocessed events
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('webhook_events');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('widget_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('event_type').notNullable(); // WIDGET_VIEW, WIDGET_INTERACTION, BOOKING_SUCCESS, etc.
    table.string('widget_id').notNullable(); // Identifier for the widget instance
    table.uuid('venue_id').references('id').inTable('venues').onDelete('CASCADE');
    table.uuid('activity_id').references('id').inTable('activities').onDelete('CASCADE');
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.jsonb('event_data'); // Additional event-specific data
    table.text('user_agent'); // Browser/user agent information
    table.string('ip_address'); // IP address for analytics
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for better query performance
    table.index(['event_type']);
    table.index(['widget_id']);
    table.index(['venue_id']);
    table.index(['activity_id']);
    table.index(['timestamp']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('widget_analytics');
};

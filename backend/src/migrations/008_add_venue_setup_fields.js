/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('venues', function(table) {
    // Add new venue setup fields
    table.json('facilities').defaultTo('[]');
    table.json('operating_hours');
    table.json('pricing');
    table.json('booking_rules');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('venues', function(table) {
    table.dropColumn('facilities');
    table.dropColumn('operating_hours');
    table.dropColumn('pricing');
    table.dropColumn('booking_rules');
  });
};

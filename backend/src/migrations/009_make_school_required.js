/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('children', function(table) {
    // First, update any existing NULL school values to a default value
    return knex('children')
      .whereNull('school')
      .update({ school: 'Not specified' })
      .then(() => {
        // Then make the column NOT NULL
        table.string('school').notNullable().alter();
      });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('children', function(table) {
    // Make school nullable again
    table.string('school').nullable().alter();
  });
};

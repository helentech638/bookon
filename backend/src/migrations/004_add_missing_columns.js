/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('activities', (table) => {
    // Check if columns exist before adding them
    knex.schema.hasColumn('activities', 'start_date').then(exists => {
      if (!exists) {
        table.date('start_date').after('venue_id');
      }
    });
    
    knex.schema.hasColumn('activities', 'end_date').then(exists => {
      if (!exists) {
        table.date('end_date').after('start_date');
      }
    });
    
    knex.schema.hasColumn('activities', 'start_time').then(exists => {
      if (!exists) {
        table.time('start_time').after('end_date');
      }
    });
    
    knex.schema.hasColumn('activities', 'end_time').then(exists => {
      if (!exists) {
        table.time('end_time').after('start_time');
      }
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('activities', (table) => {
    table.dropColumn('start_date');
    table.dropColumn('end_date');
    table.dropColumn('start_time');
    table.dropColumn('end_time');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('widget_configs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.enum('theme', ['light', 'dark', 'auto']).defaultTo('light');
    table.string('primary_color', 7).defaultTo('#00806a'); // Hex color
    table.enum('position', ['bottom-right', 'bottom-left', 'top-right', 'top-left']).defaultTo('bottom-right');
    table.boolean('show_logo').defaultTo(true);
    table.text('custom_css');
    table.boolean('is_active').defaultTo(true);
    
    // Audit fields
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('deleted_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('deleted_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['is_active']);
    table.index(['created_by']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('widget_configs');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Add new columns to Child table (only if they don't exist)
    knex.schema.hasColumn('children', 'medical_info').then(function(exists) {
      if (!exists) {
        return knex.schema.alterTable('children', function(table) {
          table.string('medical_info').nullable();
        });
      }
    }).then(function() {
      return knex.schema.hasColumn('children', 'school').then(function(exists) {
        if (!exists) {
          return knex.schema.alterTable('children', function(table) {
            table.string('school').nullable();
          });
        }
      });
    }).then(function() {
      return knex.schema.hasColumn('children', 'class').then(function(exists) {
        if (!exists) {
          return knex.schema.alterTable('children', function(table) {
            table.string('class').nullable();
          });
        }
      });
    }),

    // Add new column to Activity table
    knex.schema.alterTable('activities', function(table) {
      table.text('what_to_bring').nullable();
    }),

    // Create ChildPermission table
    knex.schema.createTable('child_permissions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('child_id').notNullable();
      table.boolean('consent_to_walk_home').defaultTo(false);
      table.boolean('consent_to_photography').defaultTo(false);
      table.boolean('consent_to_first_aid').defaultTo(false);
      table.boolean('consent_to_emergency_contact').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('child_id').references('id').inTable('children').onDelete('CASCADE');
      table.index(['child_id']);
    }),

    // Create PromoCode table
    knex.schema.createTable('promo_codes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('code').unique().notNullable();
      table.string('name').notNullable();
      table.text('description').nullable();
      table.string('type').notNullable(); // percentage, fixed_amount
      table.decimal('value', 10, 2).notNullable();
      table.decimal('min_amount', 10, 2).nullable();
      table.integer('max_uses').nullable();
      table.integer('used_count').defaultTo(0);
      table.timestamp('valid_from').notNullable();
      table.timestamp('valid_until').nullable();
      table.json('applicable_to').defaultTo('["all"]'); // venues, activities, all
      table.json('venue_ids').defaultTo('[]');
      table.json('activity_ids').defaultTo('[]');
      table.boolean('active').defaultTo(true);
      table.uuid('created_by').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('created_by').references('id').inTable('users');
      table.index(['code']);
      table.index(['active']);
      table.index(['valid_from', 'valid_until']);
    }),

    // Create PromoCodeUsage table
    knex.schema.createTable('promo_code_usages', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('promo_code_id').notNullable();
      table.uuid('booking_id').notNullable();
      table.uuid('user_id').notNullable();
      table.decimal('discount_amount', 10, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign('promo_code_id').references('id').inTable('promo_codes');
      table.foreign('booking_id').references('id').inTable('bookings');
      table.foreign('user_id').references('id').inTable('users');
      table.index(['promo_code_id']);
      table.index(['booking_id']);
      table.index(['user_id']);
    }),

    // Create PaymentSuccess table
    knex.schema.createTable('payment_successes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('booking_id').notNullable();
      table.string('payment_intent_id').unique().notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency').defaultTo('GBP');
      table.string('payment_method').notNullable(); // card, tfc, mixed
      table.boolean('receipt_sent').defaultTo(false);
      table.boolean('calendar_added').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign('booking_id').references('id').inTable('bookings');
      table.index(['booking_id']);
      table.index(['payment_intent_id']);
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    // Drop new tables
    knex.schema.dropTableIfExists('payment_successes'),
    knex.schema.dropTableIfExists('promo_code_usages'),
    knex.schema.dropTableIfExists('promo_codes'),
    knex.schema.dropTableIfExists('child_permissions'),

    // Remove new columns from Activity table
    knex.schema.alterTable('activities', function(table) {
      table.dropColumn('what_to_bring');
    }),

    // Remove new columns from Child table
    knex.schema.alterTable('children', function(table) {
      table.dropColumn('medical_info');
      table.dropColumn('school');
      table.dropColumn('class');
    })
  ]);
};

/**
 * Migration: Add Bank Feed Integration Tables
 * Description: Creates tables for bank feed transaction processing and TFC payment auto-matching
 */

exports.up = async function(knex) {
  // Create bank_feed_transactions table
  await knex.schema.createTable('bank_feed_transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('bank_reference').unique().notNullable(); // Bank's transaction reference
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('GBP');
    table.string('payment_reference').nullable(); // TFC payment reference from booking
    table.text('description').nullable(); // Bank transaction description
    table.timestamp('transaction_date').notNullable();
    table.string('bank_account').nullable(); // Bank account identifier
    table.string('status', 20).defaultTo('pending'); // pending, matched, unmatched, processed
    table.uuid('matched_booking_id').nullable(); // If matched to a booking
    table.timestamp('matched_at').nullable();
    table.timestamp('processed_at').nullable();
    table.jsonb('metadata').nullable(); // Additional bank data
    table.timestamps(true, true);

    // Indexes
    table.index('payment_reference');
    table.index('status');
    table.index('transaction_date');
    table.index('bank_reference');
    
    // Foreign key to bookings table
    table.foreign('matched_booking_id').references('id').inTable('bookings').onDelete('SET NULL');
  });

  // Add bank_feed_transactions relation to bookings table
  await knex.schema.alterTable('bookings', function(table) {
    // This will be handled by Prisma schema, but we can add a comment
    table.comment('Bookings table - includes bank_feed_transactions relation');
  });
};

exports.down = async function(knex) {
  // Drop bank_feed_transactions table
  await knex.schema.dropTableIfExists('bank_feed_transactions');
};

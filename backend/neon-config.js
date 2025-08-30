const { Pool } = require('pg');

// Neon database configuration
const neonConfig = {
  development: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/bookon_dev',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Neon-specific optimizations
    application_name: 'bookon-backend',
    statement_timeout: 30000,
    query_timeout: 30000,
  },
  test: {
    connectionString: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/bookon_test',
    ssl: false,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000,
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';
const config = neonConfig[env];

// Create connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  config
};

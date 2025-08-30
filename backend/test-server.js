console.log('Starting test...');

// Test database connection
const knex = require('knex');
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'bookon_user',
    password: 'bookon_password',
    database: 'bookon',
  }
};

const db = knex(dbConfig);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.raw('SELECT 1');
    console.log('Database connection successful:', result.rows[0]);
    
    console.log('Testing server startup...');
    const express = require('express');
    const app = express();
    
    app.get('/test', (req, res) => {
      res.json({ message: 'Server is working!' });
    });
    
    const server = app.listen(3002, () => {
      console.log('Test server running on port 3002');
      server.close();
      console.log('Test server closed');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
    console.log('Database connection closed');
  }
}

testConnection();

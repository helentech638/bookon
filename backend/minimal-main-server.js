console.log('Starting minimal main server...');

// Test basic imports
let express, cors, helmet, morgan, compression, rateLimit, slowDown, dotenv;
try {
  express = require('express');
  cors = require('cors');
  helmet = require('helmet');
  morgan = require('morgan');
  compression = require('compression');
  rateLimit = require('express-rate-limit');
  slowDown = require('express-slow-down');
  dotenv = require('dotenv');
  
  console.log('✅ All basic imports successful');
} catch (error) {
  console.error('❌ Import error:', error);
  process.exit(1);
}

// Test database connection
try {
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
  console.log('✅ Database connection setup successful');
  
  // Test connection
  db.raw('SELECT 1').then(() => {
    console.log('✅ Database connection test successful');
    
    // Create minimal server
    try {
      const app = express();
      const PORT = 3000;
      
      // Basic middleware
      app.use(cors({
        origin: 'http://localhost:3001',
        credentials: true,
      }));
      
      app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }));
      
      app.use(express.json());
      
      // Health check
      app.get('/health', (req, res) => {
        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          message: 'Minimal server working!'
        });
      });
      
      // Test route
      app.get('/test', (req, res) => {
        res.json({ message: 'Minimal server test route working!' });
      });
      
      // Start server
      app.listen(PORT, () => {
        console.log(`🚀 Minimal server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🧪 Test route: http://localhost:${PORT}/test`);
        console.log('✅ Server started successfully!');
      });
      
    } catch (error) {
      console.error('❌ Server creation error:', error);
      process.exit(1);
    }
    
  }).catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Database setup error:', error);
  process.exit(1);
}

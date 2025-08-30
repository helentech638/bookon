console.log('Starting debug server...');

// Test 1: Basic imports
let express, cors, helmet;
try {
  console.log('Testing basic imports...');
  express = require('express');
  console.log('✅ Express imported');
  
  cors = require('cors');
  console.log('✅ CORS imported');
  
  helmet = require('helmet');
  console.log('✅ Helmet imported');
  
  console.log('✅ All basic imports successful');
} catch (error) {
  console.error('❌ Import error:', error);
  process.exit(1);
}

// Test 2: Database connection
try {
  console.log('Testing database connection...');
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
  console.log('✅ Knex instance created');
  
  // Test connection
  db.raw('SELECT 1').then(() => {
    console.log('✅ Database connection successful');
    
    // Test 3: Create Express app
    try {
      console.log('Testing Express app creation...');
      const app = express();
      console.log('✅ Express app created');
      
      app.use(cors());
      console.log('✅ CORS middleware added');
      
      app.use(helmet());
      console.log('✅ Helmet middleware added');
      
      app.get('/test', (req, res) => {
        res.json({ message: 'Debug server working!' });
      });
      console.log('✅ Test route added');
      
      // Test 4: Start server
      const server = app.listen(3000, () => {
        console.log('✅ Server started on port 3000');
        console.log('🚀 Debug server is working!');
        console.log('📱 Test with: curl http://localhost:3000/test');
        
        // Close after 5 seconds
        setTimeout(() => {
          server.close();
          console.log('✅ Server closed');
          process.exit(0);
        }, 5000);
      });
      
    } catch (error) {
      console.error('❌ Express app error:', error);
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

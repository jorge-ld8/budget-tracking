require('dotenv').config({ path: '.env.development' });

// Set test-specific environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
// process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Initialize the MongoDB Memory Server
let mongod = null;

// Set up a global setup function that Jest will use
global.setupTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  
  // Set other test environment variables
  process.env.JWT_SECRET = 'test_secret';
  process.env.PORT = '3011';

  return { uri, mongod };
};

// Set up a global teardown function
global.teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
};

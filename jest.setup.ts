import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Set test-specific environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Initialize the MongoDB Memory Server
let mongod: MongoMemoryServer | null = null;

// Extend the global object to include our test setup functions
declare global {
  namespace NodeJS {
    interface Global {
      setupTestDB: () => Promise<{
        uri: string;
        mongod: MongoMemoryServer;
      }>;
      teardownTestDB: () => Promise<void>;
    }
  }
}

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
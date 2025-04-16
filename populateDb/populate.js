const envFile = process.env.NODE_ENV === 'development' ? '../.env.development' : '../.env';
require('dotenv').config({ path: envFile });
// load models
const Account = require('../server/src/models/accounts');
const Category = require('../server/src/models/categories');
const Transaction = require('../server/src/models/transactions.ts');

// load data
const accounts = require('./accounts_budgetTracking.json');
const categories = require('./categories_budgetTracking.json');
const transactions = require('./transactions_budgetTracking.json');

const MONGO_URI = process.env.MONGO_URI;
const connectDB = require('../server/src/config/config');

console.log(envFile);
console.log(MONGO_URI);

const start = async () => {
  try {
    await connectDB(MONGO_URI);
    await Transaction.insertMany(transactions);
    // await Account.insertMany(accounts);
    // await Category.insertMany(categories);
    console.log('Database populated successfully');
    process.exit(0);
  } catch (error) {
    console.log('Error populating database', error);
    process.exit(1);
  }
}

start();
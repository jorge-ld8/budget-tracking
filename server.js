const app = require('./src/app');
const connectDB = require('./src/config/config');
require('dotenv').config();
// require('express-async-errors');
// can be used to avoid using try catch in controllers


const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: envFile });


const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
    }).catch((err) => {
      console.log('Error connecting to MongoDB', err);
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
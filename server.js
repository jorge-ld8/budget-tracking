const app = require('./src/app');
const connectDB = require('./src/config/config');
require('dotenv').config();

const PORT = 3010;
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: envFile });


const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
    }).catch((err) => {
      console.log('Error connecting to MongoDB', err);
    });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
import { app } from './src/app.ts';
import env from './src/config/config.ts';
import 'express-async-errors';
import dotenv from 'dotenv';

const envFile = env.NODE_ENV === 'development' ? '.env.development' : (env.NODE_ENV === 'production' ? '.env.production' : '.env');
dotenv.config({ path: envFile });


const start = async () => {
  try {
    console.log('NODE_ENV', env.NODE_ENV);
    await env.connectDB(process.env.MONGO_URI as string).then(() => {
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
import { app } from './src/app.ts';
import { connectDB } from './src/config/config.ts';
import 'express-async-errors';
import env from './src/config/env.ts';

const start = async () => {
  try {
    console.log('NODE_ENV', env.NODE_ENV);

    // Connect to database (MongoDB)
    await connectDB(env.MONGO_URI).then(() => {
      console.log('Connected to MongoDB');
    }).catch((err) => {
      console.log('Error connecting to MongoDB', err);
    });

    // Start sever given the app = express() from app.ts
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } 
  catch (error) {
    console.log(error);
  }
};

start();
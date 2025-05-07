import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import notFound from './middlewares/not-found.ts';
import UsersRouter from './routes/users.ts';
import UsersController from './controllers/users.ts';
import AccountRouter from './routes/accounts.ts';
import AccountController from './controllers/accounts.ts';
import TransactionsRouter from './routes/transactions.ts';
import TransactionController from './controllers/transactions.ts';
import CategoriesRouter from './routes/categories.ts';
import CategoriesController from './controllers/categories.ts';
import BudgetsRouter from './routes/budgets.ts';
import BudgetController from './controllers/budgets.ts';
import ReportsRouter from './routes/reports.ts';
import ReportsController from './controllers/reports.ts';
import errorHandler from './middlewares/error-handler.ts';
import AuthRouter from './routes/auth.ts';
import AuthController from './controllers/auth.ts';
import swaggerDoc from './swagger.ts';
import path from 'path';
import fs from 'fs';
import env from './config/config.ts';
import { createStream } from 'rotating-file-stream';
import dotenv from 'dotenv';
import xss from 'xss-clean';
import rateLimiter from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// import { hpp } from 'hpp';


const app = express();

// Load environment variables
const envFile = env.NODE_ENV === 'development' ? '.env.development' : (env.NODE_ENV === 'production' ? '.env.production' : '.env');
dotenv.config({ path: envFile });


app.set('trust proxy', 1)
app.get('/ip', (req: Request, res: Response) => {
  res.send(req.ip);
});
app.get('/x-forwarded-for', (req: Request, res: Response) => {
  res.send(req.headers['x-forwarded-for']);
});



   
const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// In your Express app configuration
app.use('/uploads', express.static(path.join(import.meta.url, 'uploads')));


// Middleware
app.use(apiLimiter);
app.use(helmet({
  contentSecurityPolicy: {
      directives: {
          upgradeInsecureRequests: null
      },
  },
}));
app.use(cors());
app.use(xss());
app.use(mongoSanitize());
// app.use(hpp());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(import.meta.url, 'public')));


if (env.NODE_ENV === 'production'){
  if (!fs.existsSync(path.join(import.meta.url, 'logs'))) {
    fs.mkdirSync(path.join(import.meta.url, 'logs'), { recursive: true });
  }
  
  // Create a rotating write stream
  const accessLogStream = createStream('access.log', {
    interval: '1d', // Rotate daily
    path: path.join(import.meta.url, 'logs'),
    size: '10M', // Rotate when size exceeds 10MB
    compress: 'gzip' // Compress rotated files
  });
    app.use(morgan('combined', {
      stream: accessLogStream
    }))
}
else{
  app.use(morgan('dev'));
}

// Routes
app.use('/auth', new AuthRouter(new AuthController()).getRouter());
app.use('/users', new UsersRouter(new UsersController()).getRouter());
app.use('/accounts', new AccountRouter(new AccountController()).getRouter());
app.use('/transactions', new TransactionsRouter(new TransactionController()).getRouter());
app.use('/categories', new CategoriesRouter(new CategoriesController()).getRouter());
app.use('/budgets', new BudgetsRouter(new BudgetController()).getRouter());
app.use('/reports', new ReportsRouter(new ReportsController()).getRouter());
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the budget tracking express api"});
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

// swagger docs
swaggerDoc(app, process.env.PORT);

app.use(notFound as any);
app.use(errorHandler as any);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// And then in your route:
/**
 * @swagger
 * /users:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     // other documentation
 */

export { app };
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const notFound = require('./middlewares/not-found');
const UsersRouter = require('./routes/users');
const UsersController = require('./controllers/users');
const AccountRouter = require('./routes/accounts');
const AccountController = require('./controllers/accounts');
const TransactionsRouter = require('./routes/transactions');
const TransactionController = require('./controllers/transactions');
const CategoriesRouter = require('./routes/categories');
const CategoriesController = require('./controllers/categories');
const BudgetsRouter = require('./routes/budgets');
const BudgetsController = require('./controllers/budgets');
const errorHandler = require('./middlewares/error-handler');
const AuthRouter = require('./routes/auth');
const AuthController = require('./controllers/auth');
const { swaggerDocs } = require('./swagger');
const path = require('path');
const app = express();

// Security packages
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
   
const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

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
app.use(hpp());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

// Routes
app.use('/auth', new AuthRouter(new AuthController()).getRouter());
app.use('/users', new UsersRouter(new UsersController()).getRouter());
app.use('/accounts', new AccountRouter(new AccountController()).getRouter());
app.use('/transactions', new TransactionsRouter(new TransactionController()).getRouter());
app.use('/categories', new CategoriesRouter(new CategoriesController()).getRouter());
app.use('/budgets', new BudgetsRouter(new BudgetsController()).getRouter());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the budget tracking express api"});
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

// swagger docs
swaggerDocs(app, process.env.PORT);

app.use(notFound);
app.use(errorHandler);

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

module.exports = app;
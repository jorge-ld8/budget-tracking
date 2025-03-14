const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const notFound = require('./middlewares/not-found');
const UsersRouter = require('./routes/users');
const UsersController = require('./controllers/users');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/users', new UsersRouter(new UsersController()).getRouter());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the budget tracking express api"});
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
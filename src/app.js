const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'OK' });
});

// app.use(errorHandler);

module.exports = app;
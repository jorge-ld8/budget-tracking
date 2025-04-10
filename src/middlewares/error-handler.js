const { CustomError } = require('../errors');
const { StatusCodes } = require('http-status-codes');
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error', error: err.message });
};

module.exports = errorHandler;

const { CustomError } = require('../errors/custom-error');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof CustomError) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal Server Error', error: err.message });
};

module.exports = errorHandler;

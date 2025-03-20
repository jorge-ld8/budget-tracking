// Base error class for application-specific errors
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    // Set a default status code that can be overridden by child classes
    this.statusCode = 500;
  }
}

module.exports = CustomError; 
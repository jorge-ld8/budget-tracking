// Middleware to handle routes that don't exist
const notFound = (req, res) => res.status(404).send('Route not found\n');

module.exports = notFound;

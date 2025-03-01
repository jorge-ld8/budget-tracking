const app = require('./src/app');
// const config = require('./src/config/config');

// const PORT = config.port || 3000;
const PORT = 3010;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

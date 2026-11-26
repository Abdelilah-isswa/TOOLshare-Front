const config = require('./config');
const { connect } = require('./db');
const app = require('./app');

connect()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`ToolShare API listening on port ${config.port} (docs: /api-docs)`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

try {
  module.exports = require('./dist/backend/server');
} catch (error) {
  throw new Error(
    'Backend has not been built yet. Please run "npm run build" before starting the server.'
  );
}

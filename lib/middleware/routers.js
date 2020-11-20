let config = require('./../../config/default');

// Bind default router
module.exports = (app) => require(config.baseRouter)(app);

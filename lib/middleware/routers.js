const config = require('./../../config/instance');

// Bind default router
module.exports = (app) => require(config.baseRouter)(app);

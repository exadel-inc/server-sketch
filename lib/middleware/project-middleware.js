const glob = require('glob');
const config = require('./../../config/instance');
const { serverRoot } = require('./../helpers');

module.exports = (app) => {

  // Install user's middleware
  config.middleware && glob.sync(config.middleware, {
    cwd: serverRoot,
    absolute: true
  }).forEach((modulePath) => {
    try {
      require(modulePath)(app);
    } catch (e) {
      console.error(`Some problems with middleware: ${modulePath}. Reason: ${e.message}`);
    }
  });

};

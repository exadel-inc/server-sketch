exports.start = (serverConfig = {}) => {
  require('./config/service').createConfiguration(serverConfig);

  // Bootstrap
  require('./bin/www');

  const config = require('./config/instance');
  // Setup browser sync integration
  if (config.browserSync) {
    require('./lib/browserSync').setupBrowserSync(config);
  }

  // Open page. (if enabled browserSync integration, then browserSync will open page)
  if (config.openAfterStart && (!config.browserSync || config.browserSync.open === false)) {
    setTimeout(() => {
      require('better-opn')(config.openAfterStart);
    }, 500);
  }

};

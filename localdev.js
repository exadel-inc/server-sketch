let merge = require('lodash/merge');
let defaultConfig = require('./config/default');

exports.start = (serverConfig = {}) => {
  merge(defaultConfig, serverConfig);

  let { resolveServerPath, resolveLocalPath, template } = require('./lib/helpers');
  defaultConfig.serverViews = resolveServerPath(defaultConfig.views);
  defaultConfig.localViews = resolveLocalPath('views/');

  // merge built-in page views and user's
  defaultConfig.views = [
    defaultConfig.serverViews,
    defaultConfig.localViews
  ];

  // merge built-in page controllers and user's
  defaultConfig.controllers = [
    resolveServerPath(defaultConfig.controllers),
    resolveLocalPath('./controllers')
  ];

  // setup base router
  defaultConfig.baseRouter = defaultConfig.baseRouter ? resolveServerPath(defaultConfig.baseRouter) :
    resolveLocalPath('lib/routers/fsAsPages');

  // setup base page class
  defaultConfig.pageClass = defaultConfig.pageClass ? resolveServerPath(defaultConfig.pageClass) :
    resolveLocalPath('lib/view-engine/Page');

  // setup base component class
  defaultConfig.componentClass = defaultConfig.componentClass ? resolveServerPath(defaultConfig.componentClass) :
    resolveLocalPath('lib/view-engine/Component');

  // config for static folders (return without preprocessing)
  defaultConfig.public = defaultConfig.public.concat(defaultConfig.jscssDestFolders || []);

  defaultConfig.openAfterStart && (defaultConfig.openAfterStart = template(defaultConfig.openAfterStart));

  // server config stored as a global variable
  global.SERVER_CONFIG = defaultConfig;

  // Bootstrap
  require('./bin/www');

  // Setup browser sync integration
  defaultConfig.browserSync && require('./lib/browserSync').setupBrowserSync(defaultConfig);

  // Open page. (if enabled browserSync integration, then browserSync will open page)
  defaultConfig.openAfterStart && (!defaultConfig.browserSync || defaultConfig.browserSync.open === false) && setTimeout(() => {
    require('opn')(defaultConfig.openAfterStart);
  }, 500);

};

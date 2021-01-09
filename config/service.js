const merge = require('lodash/merge');
const once = require('lodash/once');
const config = require('./instance');

exports.createConfiguration = once((serverConfig = {}) => {

  merge(config, serverConfig);

  const { resolveServerPath, resolveLocalPath, template, normalizePort } = require('./../lib/helpers');

  const serverViews = resolveServerPath(config.views);
  const localViews = resolveLocalPath('views/');

  merge(config, {
    serverViews, // user's views
    localViews, // server local views
    views: [ // merge built-in page views and user's
      serverViews,
      localViews
    ],
    controllers: [ // merge built-in page controllers and user's
      resolveServerPath(config.controllers),
      resolveLocalPath('./controllers')
    ],
    baseRouter: resolveServerPath(config.baseRouter) || resolveLocalPath('lib/routers/fsAsPages'), // setup base router
    pageClass: resolveServerPath(config.pageClass) || resolveLocalPath('lib/view-engine/Page'), // setup base page class
    componentClass: resolveServerPath(config.componentClass) || resolveLocalPath('lib/view-engine/Component'), // setup base component class
    'public': config.public.concat(config.jscssDestFolders || []), // config for static folders (return without preprocessing)
  });

  config.openAfterStart = template(config.openAfterStart) || config.openAfterStart;

  config.port = normalizePort(config.port);
});

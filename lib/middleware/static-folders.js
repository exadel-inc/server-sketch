let express = require('express');
let config = require('./../../config/default');
let { resolveServerPath } = require('./../helpers');

module.exports = (app) => {

  // Setup folder with static files (assets)
  config.public && config.public.forEach((folder) => {
    folder = resolveServerPath(folder);
    if (config.optimization) {
      app.use(express.static(folder, { maxAge: config.cacheTime * 60 * 1000 })); // Cache time
    } else {
      app.use(express.static(folder));
    }
  });

};

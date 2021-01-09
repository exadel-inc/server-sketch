const express = require('express');
const config = require('./../../config/instance');
const { resolveServerPath } = require('./../helpers');

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

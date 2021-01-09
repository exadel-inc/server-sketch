const config = require('./../config/instance');
const express = require('express');
const engine = require('express-dot-engine');
const { serverRoot } = require('./helpers');

const app = express(); // Create express app
global.SERVER_ROOT = serverRoot; // Path to server root folder

// view engine setup
engine.settings.dot = config.doT; // Configure doT.js engine (for pages)
app.engine('html', engine.__express);
app.set('views', config.views);
app.set('view engine', 'html');

require('./middleware/optimization')(app); // Configure folders with static
require('./middleware/static-folders')(app); // Configure folders with static
require('./middleware/project-middleware')(app); // Install original project callbacks
require('./middleware/routers')(app); // Setup base routers
require('./middleware/http-proxy')(app); // Setup proxy requests
require('./middleware/404')(app); // setup 404 handler
require('./middleware/error-handler')(app); // Handle errors

module.exports = app;

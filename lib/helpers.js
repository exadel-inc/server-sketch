const template = require('lodash/template');
const path = require('path');
const config = require('./../config/instance');
const fs = require('fs');

// Resolve file in node process folder
exports.resolvePath = (file) => path.resolve(`${process.cwd()}/${file}`);

// path to user server root folder
exports.serverRoot = exports.resolvePath(config.serverRoot);

// Resolve file in user /server
exports.resolveServerPath = (file) => file ? path.resolve(`${exports.serverRoot}/${file}`) : null;

// Resolve file in "server-sketch"
exports.resolveLocalPath = (file) => file ? path.resolve(`${__dirname}/../`, file) : null;

// Compile template string and fill config data
exports.template = (tpl, data = config) => typeof tpl === 'string' ? template(tpl)(data) : null;

// Find Page/Layout template in views
exports.findView = (view) => {
  view = exports.findFileInFolders(view, config.views);
  if (view) {
    return view.replace(/\.html$/, '');
  }
};

// Find first folder with file
exports.findFileInFolders = (file, folders = []) => {

  let fullPath = null; // File doesn't exist
  folders.find((folder) => {
    if (fs.existsSync(`${folder}/${file}`)) {
      fullPath = `${folder}/${file}`;
      return true;
    }
    return false;
  });

  return fullPath;
};

// Initiate page rendering
exports.renderPage = (request, response, view, data = {}) => {
  const Page = require(config.pageClass); // By default ./lib/Page.js
  const page = new Page({ request, response, view, data });
  response.render(view.replace(/\.html$/, ''), page); // render HTML page and send response to user
};

// Normalize a port into a number, string, or false.
exports.normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

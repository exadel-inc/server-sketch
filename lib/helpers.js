let template = require('lodash/template');
let path = require('path');
let config = require('./../config/default');
let fs = require('fs');

// Resolve file in node process folder
exports.resolvePath = (file) => path.resolve(`${process.cwd()}/${file}`);

// path to user server root folder
exports.serverRoot = exports.resolvePath(config.serverRoot);

// Resolve file in user /server
exports.resolveServerPath = (file) => path.resolve(`${exports.serverRoot}/${file}`);

// Resolve file in "server-sketch"
exports.resolveLocalPath = (file) => path.resolve(`${__dirname}/../`, file);

// Compile template string and fill config data
exports.template = (tpl) => template(tpl)(config);

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
  let Page = require(config.pageClass); // By default ./lib/Page.js
  let page = new Page({ request, response, view, data });
  response.render(view.replace(/\.html$/, ''), page); // render HTML page and send response to user
};

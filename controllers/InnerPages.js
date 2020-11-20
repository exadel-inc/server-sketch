let { startCase } = require('lodash');
let { dirname } = require('path');
let config = require('./../config/default');
let glob = require('glob');

/**
 * Get list of sub pages for current request (usefull with default routing)
 */

module.exports = function (folderPath) {
  if (folderPath.endsWith('.html')) {
    folderPath = dirname(folderPath);
    if (!folderPath.endsWith('/')) folderPath += '/';
  }
  return glob.sync('*', {
    cwd: `${config.serverViews}/pages/${folderPath}`, // Get all sub folders and HTML pages
    mark: true
  }).map((file) => {
    if (file.startsWith('_')) return null; // Ignore files, started with "_" (but they are available directly)
    let isDir = file.endsWith('/');
    return {
      title: startCase(file.replace(/\.html$/, '')), // User friendly format
      isDir: isDir,
      href: isDir ? `${folderPath}${file}${config.defaultPageUrl}` : `${folderPath}${file}` // link to page
    };
  }).filter(v => !!v);
};

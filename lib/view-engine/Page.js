const url = require('url');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const config = require('./../../config/instance');
const { findFileInFolders, resolveServerPath } = require('./../helpers');

// Currently doT.js express view engine doesn't support class instance
function Page(options) {
  this.request = options.request;
  this.response = options.response;
  this.view = options.view;
  this.data = options.data || {};
  this.location = url.parse(this.request.originalUrl, true);

  !this.view.endsWith('.html') && (this.view += '.html');
}

Page.prototype = {

  getTemplate(filename, options, callback) {
    const isAsync = callback && typeof callback === 'function';
    !filename.endsWith('.html') && (filename += '.html');

    if (!isAsync) return processPageTemplate(fs.readFileSync(filename, 'utf8'), filename, options);

    // async
    fs.readFile(filename, 'utf8', (err, str) => {
      if (err) {
        callback(new Error(`Failed to open view file (${filename})`));
        return;
      }
      try {
        str = processPageTemplate(str, filename, options);
        callback(null, str);
      } catch (processErr) {
        callback(processErr);
      }
    });
  },

  // Helpers
  getPageTitle(layoutTitle) {
    if (layoutTitle) {
      return layoutTitle;
    } else {
      let pathname = this.location.pathname;
      if (pathname.endsWith(config.defaultPageUrl)) {
        pathname = path.dirname(pathname);
      } else {
        pathname = pathname.replace(/\.html$/, '');
      }
      return _.startCase(_.last(pathname.split('/')));
    }
  },

  getTitle(layoutTitle) {
    if (layoutTitle) {
      return layoutTitle;
    } else {
      let pathname = this.location.pathname;
      if (pathname.endsWith(config.defaultPageUrl)) {
        pathname = path.dirname(pathname);
      } else {
        pathname = pathname.replace(/\.html$/, '');
      }
      return _.compact(pathname.split('/').reverse().map(_.startCase)).join(' | ');
    }
  },

  resolveURL(pathname = '') {
    if (pathname.startsWith('/')) {
      const folder = path.dirname(this.location.pathname);
      return `./${path.posix.relative(folder, pathname)}`;
    }
    return pathname;
  },

  invokeController(controllerName, ...args) {
    try {
      let controller = findFileInFolders(`${controllerName}.js`, config.controllers);
      if (!controller) {
        throw new Error(`Can't find files: ${config.controllers.map((folder) => folder + '/' + controllerName + '.js')}`);
      }
      controller = require(controller);
      if (typeof controller === 'function') return controller.apply(this, args) || '';
      return '';
    } catch (e) {
      throw new Error(`Problems with "${controllerName}" controller. Reason: ${e.message}`);
    }
  },

  getFile(file) {
    return fs.readFileSync(resolveServerPath(file));
  },

  initComponent(component, options) {
    const Component = require(config.componentClass);
    return new Component(component, options, this);
  },

  renderComponent(component, options) {
    return this.initComponent(component, options).render();
  }

};

function processPageTemplate(pageTemplate, file, options) {
  return require('./prerender-hooks').process(pageTemplate, { file, options });
}

module.exports = Page;


let fs = require('fs');
let _ = require('lodash');
let config = require('./../../config/default');
let { resolvePath, resolveLocalPath } = require('./../helpers');
let prerender = require('./prerender-hooks');
let doT = require('dot/doT.js');
let glob = require('glob');
let path = require('path');

class Component {

  constructor(alias, options = {}, context = null) {
    this.config = {};
    this.data = {};
    this.name = alias;
    this.id = _.uniqueId(alias.replace(/\W/g, '-'));
    this.options = options;
    this.context = context;
    this.error = null;
    this.componentPath = this.getComponentPath();

    return this._init() || this;
  }

  getComponentPath() {
    return resolvePath(`${config.components}/${this.name}`);
  }

  _init() {
    try {

      if (!fs.existsSync(this.componentPath)) {
        throw new Error(`Component "${this.name}" doesn't exist.`);
      }

      let configJSON = this.getConfig();
      this.config = configJSON;

      this.evalData();

      this.view = this._getFile(configJSON.view);


      if (configJSON.controller) {
        let controller = _.extend(this, require(this.resolvePath(configJSON.controller)));
        controller.init && (controller.init());
        return controller;
      }

    } catch (e) {
      this.onError(`Can't init component: "${this.name}". Error: ${e.message}.`, e);
    }
  }

  evalData() {
    let { options: { data }, config: configJSON } = this;

    // Eval data
    if (!configJSON.ignoreDataProcessing) {
      if (typeof data === 'string') {
        if (configJSON.data[data]) {
          this.data = configJSON.data[data]
        } else {
          throw new Error(`Invalid data(value: "${data}") option was provided into the component. Possible values: ${Object.keys(configJSON.data).join(', ') || 'no'}`);
        }
      } else if (typeof data === 'object') {
        this.data = data;
      } else {
        this.data = configJSON.data;
      }
    } else {
      this.data = data;
    }
  }

  resolvePath(file) {
    return `${this.componentPath}/${file}`;
  }

  _getFile(file) {
    try {
      return fs.readFileSync(this.resolvePath(file), 'utf8');
    } catch (e) {
      this.onError(`Can't read file: ${file}. Error: ${e.message}`, e);
    }
  }

  onError(msg, error = new Error()) {
    error.message = msg;
    this.error = this.error || error;
  }

  getConfig(configFileName = 'config.json') {
    try {
      let configFile = prerender
        .process(this._getFile(configFileName), { file: this.resolvePath(configFileName), options: {} });

      configFile = JSON.parse(configFile.replace(/\\/gi, '/')); // Hello Bill Gates!
      configFile.data = configFile.data || {};

      this._mergeDataFiles(configFile.data);

      if (configFile['@extendConfig']) {
        configFile = _.merge({}, this.getConfig(configFile['@extendConfig']), configFile);
      }
      return configFile;
    } catch (e) {
      this.onError(`Can't parse config file: ${configFileName}. Error: ${e.message}`, e);
    }
  }

  getDataFile(dataFileName) {
    try {
      let dataFile = prerender
        .process(this._getFile(dataFileName), { file: this.resolvePath(dataFileName), options: {} });

      dataFile = JSON.parse(dataFile.replace(/\\/gi, '/')); // Hello Bill Gates!

      if (dataFile['@extend']) {
        dataFile = _.merge({}, this.getDataFile(dataFile['@extend']), dataFile);
      }
      return dataFile;
    } catch (e) {
      this.onError(`Can't parse data file: ${dataFileName}`, e);
    }
  }

  _mergeDataFiles(originalData) {
    glob.sync('./data-*.json', {
      cwd: this.componentPath
    }).forEach((dataFile) => {
      const [, name] = path.basename(dataFile).match(/data-(.+)\.json$/);
      originalData[name] = this.getDataFile(dataFile);
    });
  }

  // Rendition methods
  initComponent(alias, options) {
    return new this.constructor(alias, options, this);
  }

  renderComponent(alias, options) {
    let component = this.initComponent(alias, options);
    return component.render();
  }

  render() {
    if (this.error) {
      return this.renderError(this.error);
    }
    let result = this._compileView();
    return this.error ? this.renderError(this.error) : result;
  }

  _compileView(view = this.view, data = this.data, fileName = this.resolvePath(this.config.view)) {
    try {
      let tplsConfig = config.doT;
      tplsConfig.varname = `${this.config.var || 'component'}, data, options, page, partial`;
      return doT.template(view, tplsConfig)(this, data, this.options, this._page, this.partial.bind(this));
    } catch (e) {
      this.onError(`Can't compile template: "${fileName}". Error: ${e.message}`, e);
    }
  }

  partial(partialPath, data) {
    try {
      return this._compileView(this._getFile(partialPath), data, this.resolvePath(partialPath));
    } catch (e) {
      this.onError(`Can't compile partial: "${partialPath}". Error: ${e.message}`, e);
    }
  }

  get _page() {
    let context = this.context;
    while (context && !context.location) context = context.context;
    return context || null;
  }

  renderError(error) {
    try {
      const standartErrorView = resolveLocalPath('views/partials/invalid-component.html');
      return config.invalidComponent ?
        this.renderComponent(config.invalidComponent, { data: error }) :
        this._compileView(fs.readFileSync(standartErrorView, 'utf-8'), error, standartErrorView);
    } catch (e) {
      return error.message;
    }
  }
}

module.exports = Component;

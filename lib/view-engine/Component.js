const fs = require('fs');
const _ = require('lodash');
const config = require('./../../config/instance');
const { resolvePath, resolveLocalPath } = require('./../helpers');
const prerender = require('./prerender-hooks');
const glob = require('glob');
const path = require('path');

const RENDERERS = ['jsx', 'dot-js'];
const JSX_VIEW_EXTENSIONS = ['.jsx', '.tsx'];

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

      const configJSON = this.getConfig();
      this.config = configJSON;

      this.evalData();

      // JSX views are React modules compiled at render time (see ./jsx.js),
      // not doT.js text templates — don't read them as a string.
      this.view = this._getRendererName() === 'jsx' ? null : this._getFile(configJSON.view);

      if (configJSON.controller) {
        const controller = _.extend(this, require(this.resolvePath(configJSON.controller)));
        controller.init && (controller.init());
        return controller;
      }

    } catch (e) {
      this.onError(`Can't init component: "${this.name}". Error: ${e.message}.`, e);
    }
  }

  evalData() {
    const { options: { data }, config: configJSON } = this;

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

      configFile = JSON.parse(configFile);
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

      dataFile = JSON.parse(dataFile);

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
    const component = this.initComponent(alias, options);
    return component.render('dot-js');
  }

  renderJsxComponent(alias, options) {
    const component = this.initComponent(alias, options);
    return component.render('jsx');
  }

  render(renderer = this._getRendererName()) {
    if (this.error) {
      return this.renderError(this.error);
    }
    const result = this._compileView(this.view, this.data, this.resolvePath(this.config.view), renderer);
    return this.error ? this.renderError(this.error) : result;
  }

  _compileView(view = this.view, data = this.data, fileName = this.resolvePath(this.config.view), renderer = this._getRendererName()) {
    try {
      // Defense in depth: only allowlisted renderer names ever reach require().
      const name = String(renderer).toLowerCase();
      const safeRenderer = RENDERERS.includes(name) ? name : 'dot-js';
      this._assertRendererMatchesView(safeRenderer, fileName);
      return require(`./${safeRenderer}-renderer`)({
        component: this,
        view,
        data,
        fileName
      });
    } catch (e) {
      this.onError(`Error during compiling view "${fileName}": ${e.message}`, e);
    }
  }

  /**
   * Picks the renderer from the view extension. Because this lives on the base
   * class, subclasses inherit JSX support automatically.
   */
  _getRendererName() {
    const componentConfig = this.config || {};
    // React views (.jsx / .tsx) are handled by the JSX renderer.
    return this._isJsxView(componentConfig.view) ? 'jsx' : 'dot-js';
  }

  _isJsxView(view) {
    return JSX_VIEW_EXTENSIONS.includes(path.extname(view || '').toLowerCase());
  }

  _assertRendererMatchesView(renderer, fileName) {
    const isJsxView = this._isJsxView(fileName);

    if (renderer === 'jsx' && !isJsxView) {
      throw new Error(`Component "${this.name}" uses doT.js view "${this.config.view}". Use renderComponent() for .html views.`);
    }

    if (renderer === 'dot-js' && isJsxView) {
      throw new Error(`Component "${this.name}" uses JSX view "${this.config.view}". Use renderJsxComponent() for .jsx/.tsx views.`);
    }
  }

  // Props passed to the JSX view. Default is `{ data: component.data }`.
  // Override it in a component's controller (or subclass) to pass more
  // (page, component, config, partial, ...) — see README "React / JSX component".
  buildProps() {
    return { data: this.data };
  }

  partial(partialPath, data) {
    try {
      // Partials are always doT.js HTML fragments (meant for raw HTML
      // injection), regardless of the component's own renderer.
      return this._compileView(this._getFile(partialPath), data, this.resolvePath(partialPath), 'dot-js');
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
        this._renderErrorComponent(config.invalidComponent, error) :
        // The error view is always a doT.js HTML template — force dot-js even
        // for JSX components so a render failure is still readable.
        this._compileView(fs.readFileSync(standartErrorView, 'utf-8'), error, standartErrorView, 'dot-js');
    } catch (e) {
      return error.message;
    }
  }

  _renderErrorComponent(alias, error) {
    const component = this.initComponent(alias, { data: error });
    return component.render(component._getRendererName());
  }
}

module.exports = Component;

const fs = require('fs');
const path = require('path');
const config = require('./../../config/instance');
const { resolvePath } = require('./../helpers');
const prerender = require('./prerender-hooks');
const Component = require('./Component');
const JsxComponent = require('./JsxComponent');

// Map of view file extension -> component class.
// Everything else falls back to the base Component (doT.js HTML).
const viewClasses = {
  '.jsx': JsxComponent
};

/**
 * Component factory: picks the right component class based on the view type
 * declared in the component config and creates an instance.
 *
 *   .html -> base Component (doT.js)
 *   .jsx  -> JsxComponent (React SSR)
 */
function init(alias, options = {}, context = null) {
  const ViewClass = getViewClass(alias);
  return new ViewClass(alias, options, context);
}

function getViewClass(alias) {
  try {
    const viewFile = peekView(getComponentPath(alias));
    return viewClasses[path.extname(viewFile || '').toLowerCase()] || getBaseComponentClass();
  } catch (e) {
    return getBaseComponentClass();
  }
}

// The class used for non-JSX (HTML) components. Respects the configurable
// "componentClass" so the base class can be customized per project.
function getBaseComponentClass() {
  return config.componentClass ? require(config.componentClass) : Component;
}

function getComponentPath(alias) {
  return resolvePath(`${config.components}/${alias}`);
}

// Reads the effective "view" value from the component config (without
// constructing the instance) so the factory can decide the class to use.
function peekView(componentPath, configFileName = 'config.json') {
  const configFile = path.join(componentPath, configFileName);
  const configJSON = JSON.parse(prerender.process(fs.readFileSync(configFile, 'utf8'), { file: configFile, options: {} }));

  if (configJSON.view) {
    return configJSON.view;
  }
  if (configJSON['@extendConfig']) {
    return peekView(componentPath, configJSON['@extendConfig']);
  }
  return null;
}

module.exports = { init, getViewClass, getComponentPath, peekView, Component, JsxComponent };

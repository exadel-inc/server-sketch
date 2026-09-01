const config = require('./../../config/instance');
const doT = require('dot');

function compileView(options) {
  const { component, view, data } = options;
  const tplsConfig = Object.assign({}, config.doT);
  tplsConfig.varname = `${component.config.var || 'component'}, data, options, page, partial`;

  return doT.template(view, tplsConfig)(component, data, component.options, component._page, component.partial.bind(component));
}

module.exports = compileView;

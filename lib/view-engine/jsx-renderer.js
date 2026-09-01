const { renderJsx } = require('./jsx');

/**
 * JSX renderer: transpiles & renders the component's `.jsx` view with React
 * SSR (react-dom/server). Called by Component._compileView when the renderer
 * resolves to "jsx".
 *
 * Accepts the same options object as the doT renderer ({ component, view,
 * data, fileName }); only `component` and `fileName` are used here — the .jsx
 * file is compiled fresh from `fileName` on every render (see ./jsx.js), and
 * the view props come from component.buildProps() (overridable in the
 * component's controller/subclass).
 */
function compileView(options) {
  const { component, fileName } = options;
  return renderJsx(component, component.buildProps(), fileName);
}

module.exports = compileView;

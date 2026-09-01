const Component = require('./Component');

/**
 * @deprecated The base {@link Component} now picks the renderer from the
 * component config (`config.json > "renderer": "jsx"` or a `.jsx` view), so
 * this subclass is no longer needed for JSX support. It is kept only for
 * backwards compatibility: it forces the JSX renderer regardless of config.
 */
class JsxComponent extends Component {

  _getRendererName() {
    return 'jsx';
  }
}

module.exports = JsxComponent;

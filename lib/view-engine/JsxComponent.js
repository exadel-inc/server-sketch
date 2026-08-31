const Component = require('./Component');
const { renderJsx } = require('./jsx');

/**
 * Component variant that renders a React (JSX) component on the server
 * instead of a doT.js HTML template. Extends the base {@link Component} and
 * overrides only the parts that differ for JSX rendering.
 *
 * The .jsx view is transpiled and compiled into a brand new module on every
 * render (see ./jsx.js), so edits are picked up without a server restart.
 */
class JsxComponent extends Component {

  // The view is a .jsx module, not a text template — don't read it as HTML.
  _initView(configJSON) {
    this.viewFile = configJSON.view;
    this.isJsx = true;
  }

  render() {
    if (this.error) {
      return this.renderError(this.error);
    }
    return this._renderJsx();
  }

  _renderJsx() {
    try {
      const props = this.buildProps();
      return renderJsx(this, props);
    } catch (e) {
      this.onError(`Can't render JSX component: "${this.name}". Error: ${e.message}`, e);
      return this.renderError(this.error);
    }
  }

  buildProps() {
    return {
      data: this.data
    };
  }
}

module.exports = JsxComponent;

const fs = require('fs');
const Module = require('module');
const path = require('path');
const { transform } = require('sucrase');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// View extensions handled by this React-SSR renderer. `.tsx` is TypeScript
// JSX; `.ts` covers plain-TypeScript sibling modules.
const JSX_EXTENSIONS = ['.jsx', '.tsx', '.ts'];

/**
 * Render a React (JSX/TSX) component on the server.
 *
 * The view file is transpiled with Sucrase and compiled into a brand new module
 * on every call, so edits are picked up on the next render without restarting
 * the server (unlike native require(), which caches modules).
 *
 * The component file may export the component as an ESM default export or as a
 * CommonJS module.exports.
 */
function renderJsx(component, props, file) {
  // `file` is the absolute path to the view, provided by the jsx renderer;
  // fall back to resolving it from the component config for direct calls.
  const viewFile = file || component.resolvePath(component.config.view);

  // Compile into a fresh module on each render -> no require cache -> hot reload
  const mod = new Module(viewFile, module);
  mod.filename = viewFile;
  // Resolve dependencies from the component's own project first, then from the
  // server's node_modules (so `react` is always available to the component).
  mod.paths = [...Module._nodeModulePaths(path.dirname(viewFile)), ...module.paths];
  mod._compile(transpile(viewFile), viewFile);

  const exports = mod.exports;
  const ComponentFn = exports.__esModule ? exports.default : (exports.default || exports);

  return renderToStaticMarkup(React.createElement(ComponentFn, props));
}

// Transpiles a .jsx/.tsx/.ts view with Sucrase:
//   - `typescript` -> strips TypeScript type annotations (.tsx / .ts)
//   - `jsx`        -> transforms JSX (automatic runtime)
//   - `imports`    -> converts ESM import/export to CommonJS
// Sucrase does NOT type-check — it only strips types (like Babel preset-typescript).
function transpile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const { code } = transform(source, {
    transforms: ['typescript', 'jsx', 'imports'],
    jsxRuntime: 'automatic',
    production: true,
    filePath: file
  });

  return code;
}

// Sibling view files (e.g. imported sub-components/helpers) are loaded via plain
// Node require() from inside the compiled module, so they need the same Sucrase
// transform hooked into Node's own module loader for those extensions.
JSX_EXTENSIONS.forEach((ext) => {
  require.extensions[ext] = (mod, file) => mod._compile(transpile(file), file);
});

module.exports = { renderJsx };

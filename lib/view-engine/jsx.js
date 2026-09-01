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

  // Transpile hooks for sibling/embedded view imports are installed ONLY for
  // the duration of this render (scoped to the project root) and restored
  // afterwards, so the process is never left with a global require.extensions
  // mutation.
  const restoreTranspileHooks = installTranspileHooks(process.cwd());

  try {
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
  } finally {
    restoreTranspileHooks();
  }
}

/**
 * Temporarily installs Sucrase transpile hooks for view files (.jsx/.tsx/.ts)
 * loaded via plain Node require() from inside a compiled view.
 *
 * Scope = the project root (process.cwd()), so a view can import sibling views
 * from other components (component embedding) and project helpers. Files inside
 * node_modules and files outside the project root are NOT transpiled — they
 * fall back to the previously registered loader (if any) or fail with a clear
 * error.
 *
 * Returns a function that restores require.extensions to their previous state.
 */
function installTranspileHooks(scopeRoot) {
  const previous = {};
  const rootPrefix = scopeRoot + path.sep;
  const nodeModulesMarker = path.sep + 'node_modules' + path.sep;

  JSX_EXTENSIONS.forEach((ext) => {
    previous[ext] = require.extensions[ext];
    require.extensions[ext] = (mod, file) => {
      const isProjectFile = file.startsWith(rootPrefix) && !file.includes(nodeModulesMarker);

      if (isProjectFile) {
        mod._compile(transpile(file), file);
      } else if (previous[ext]) {
        previous[ext](mod, file);
      } else {
        throw new Error(
          `[server-sketch] Cannot transpile "${file}": it's outside the project root (${scopeRoot}) ` +
          'or inside node_modules, and has no registered loader.'
        );
      }
    };
  });

  return () => {
    JSX_EXTENSIONS.forEach((ext) => {
      if (previous[ext] === undefined) {
        delete require.extensions[ext];
      } else {
        require.extensions[ext] = previous[ext];
      }
    });
  };
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

module.exports = { renderJsx };

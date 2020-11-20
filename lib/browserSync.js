const browserSync = require('browser-sync').create('server-sketch');
const { debounce, merge } = require('lodash');
const { extname } = require('path');

function watch(pattern, cb) {
  // simple wrapper on browserSync.watch
  (pattern && pattern.length) && browserSync.watch(pattern, {}).on('change', debounce(cb, 300));
  return watch;
}

exports.setupBrowserSync = (config) => {
  // Internal component files
  const templates = [
    `${config.components}**/*.html`, // component's templates
    `${config.serverRoot}views/pages/**/*.html`, // pages
    `${config.components}**/data-*.json`, // component's data
    `${config.components}**/config.json` // component's configs
  ];
  return new Promise((resolve) => {
    const browserSyncConfig = config.browserSync;
    const watchingFiles = templates
      .concat(config.jscssDestFolders || [])
      .concat(browserSyncConfig.watchAndReload || []);

    let css = [];
    let reload = [];
    watchingFiles.forEach((dest) => {
      const ext = extname(dest);
      if (ext === '.css') { // watching css file
        css.push(dest);
      } else if (!ext) { // is folder. split with css file or not
        css.push(`${dest}/**/*.css`);
        reload.push(`${dest}/**/*.!(css)`);
      } else {
        reload.push(dest); // other files
      }
    });

    watch(reload, browserSync.reload); // full page reload
    watch(css, () => browserSync.reload('*.css')); // reload css files without full page reload

    browserSync.init(merge({
      open: !!config.openAfterStart,
      startPath: config.openAfterStart ? new URL(config.openAfterStart).pathname : '/',
      ui: false,
      proxy: `http://localhost:${config.port}`
    }, browserSyncConfig), resolve);

  });
};

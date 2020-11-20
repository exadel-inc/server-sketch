module.exports = {
  openAfterStart: 'http://localhost:<%= port %>/index.html', // Automatically open URL after web-server will be started
  baseRouter: null, // Relative (to ${serverRoot} option) path to base router. It disables default file-folder routing. Should exports function. First argument will be express app instance
  port: 3000, // Port for web server
  optimization: false, // Enable optimizations. Cache + gzip + view cache + runtime cache for base router
  cacheTime: 120, // Max live cache
  listenDomain: null,
  get doT() { // Configuration for templates
    return {
      evaluate: /\{\{([\s\S]+?)\}\}/g,
      interpolate: /\{\{=([\s\S]+?)\}\}/g,
      encode: /\{\{!([\s\S]+?)\}\}/g,
      use: /\{\{#([\s\S]+?)\}\}/g,
      define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
      conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
      iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
      varname: 'layout, partial, locals, page',
      strip: false,
      append: true,
      selfcontained: false
    }
  },
  defaultPageUrl: 'index.html', // Navigate to that page if ".html" doesn't exists in the url.
  defaultPageRendition: 'index.html', // Default page view for URLs: /path/to/index.html. You can override it with: server/views/index.html

  // custom folders
  serverRoot: 'server/', // Server ROOT folder.
  views: 'views/', // Path to directory with views. Relative to Server ROOT
  controllers: 'controllers/', // Folder with page controllers. Relative to Server ROOT
  components: 'src/', // Path to components. Relative to Project ROOT
  middleware: 'middleware/*.js', // Middleware for Express. Can be array. Js files should export function. Function will retrieve as a first argument: express app instance
  public: [ // Path to static files
    'static/'
    // config.jscssDestFolders will be added
  ],
  jscssDestFolders: [ // Path to generated js & css files(used by browserSync & public). Relative to server
    '../dest/',
    '../.temp/dest/'
  ],
  browserSync: {
    port: 3001,
    watchAndReload: [
      // config.jscssDestFolders will be added
    ]
  }
};

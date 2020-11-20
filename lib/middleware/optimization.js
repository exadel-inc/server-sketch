let { optimization, cacheTime } = require('./../../config/default');
let compression = require('compression');

// Caching
module.exports = (app) => {
  if (optimization) {
    app.use(compression());
    app.set('view cache', true);
    app.get(/.*\.html$/, (request, response, next) => {
      response.header('Cache-Control', `max-age=${cacheTime * 60}, must-revalidate`);
      next();
    });
  }
};

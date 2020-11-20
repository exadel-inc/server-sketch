let { findView, renderPage } = require('./../helpers');

module.exports = (app) => {

  // error handler
  app.use((err, request, response, next) => {
    response.locals.message = err.message;
    response.locals.error = err;

    // render the error page
    response.status(err.status || 500);
    let customErrorRendition = findView(`${err.status}.html`); // Try to find template page for specific error
    renderPage(request, response, customErrorRendition || 'error', err); // Render Error page :)
  });

};

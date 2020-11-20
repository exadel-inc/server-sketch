module.exports = (app) => {

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    let err = new Error('Not Found'); // Delegating to regular "error-handler.js" middleware
    err.status = 404;
    next(err);
  });

};

let fsAsPagesRouter = require('express').Router();

module.exports = (app) => app.use('/', fsAsPagesRouter);

module.exports.router = fsAsPagesRouter;


let config = require('./../../config/default');
let url = require('url');
let path = require('path');

const DEFAULT_URL_PAGE = config.defaultPageUrl;
const DEFAULT_PAGE_RENDITION = config.defaultPageRendition;

let { findView, renderPage } = require('./../helpers');

// Cache HTML Response
if (config.optimization) {
  let _runtimeCache = {};
  fsAsPagesRouter.get(/.*\.html$/, (request, response, next) => {
    let _send = response.send;
    Object.keys(_runtimeCache).length > 50 && (_runtimeCache = {}); // Max 50 pages will be cached
    if (_runtimeCache[request.originalUrl]) {
      _send.call(response, _runtimeCache[request.originalUrl]);
      return;
    } else {
      response.send = function (body) {
        _runtimeCache[request.originalUrl] = body;
        _send.call(response, body);
      };
    }
    next();
  });

  setInterval(() => _runtimeCache = {}, config.cacheTime * 60 * 1000);
}


// Navigator for HTML files
fsAsPagesRouter.get(/.*\.html$/, (req, res, next) => {
  try {
    let params = url.parse(req.url, true);
    const pathname = params.pathname;
    const pageFolder = path.dirname(pathname);
    const pageFileName = path.basename(pathname);

    let rendition = findPage(pathname);
    if (!rendition && pageFileName === DEFAULT_URL_PAGE && findPage(pageFolder)) { // Folder exists, use default rendition
      rendition = DEFAULT_PAGE_RENDITION; // Use default index file for folders
    }

    if (rendition) {
      renderPage(req, res, rendition); // Render Page :)
      return;
    }

    next();
  } catch (e) {
    next(e);
  }
});

// Redirect to ROOT
fsAsPagesRouter.get('/', (req, res, next) => res.redirect(301, `/${DEFAULT_URL_PAGE}`));

// Handler for non .html requests
fsAsPagesRouter.get('/*', (req, res, next) => {
  let urlParams = url.parse(req.url, true);
  const pathname = urlParams.pathname;

  // If folders exists, then redirect to index
  if (!pathname.endsWith('.html') && findPage(pathname)) {
    urlParams.pathname = `${urlParams.pathname}/${DEFAULT_URL_PAGE}`.replace(/\/\/+/g, '/');
    res.redirect(301, url.format(urlParams));
    return;
  }

  next();
});

function findPage(page) {
  return findView(`/pages/${page}`);
}


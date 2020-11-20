let httpProxy = require('express-http-proxy');
let template = require('lodash/template');
let url = require('url');
let { proxy } = require('./../../config/default');

let convertToExtFormat = (simpleFormat) => {

  let extFormat = {
    defaultHost: simpleFormat.defaultHost,
    rules: []
  };

  for (let from in simpleFormat) {
    if (simpleFormat.hasOwnProperty(from) && from !== 'defaultHost') {
      extFormat.rules.push({
        'from': from,
        'to': simpleFormat[from]
      });
    }
  }

  return extFormat;
};


module.exports = (app) => {

  if (proxy) {
    // Possible to use mapping for proxy.rules config
    if (!(proxy.rules instanceof Array)) proxy = convertToExtFormat(proxy);

    const defaultHost = url.parse(proxy.defaultHost || '');
    const fakeUserResDecorator = (proxyRes, proxyResData) => proxyResData;
    const fakeUserResHeaderDecorator = (headers) => headers;

    proxy.rules.forEach(({ from, to, transform, transformHeaders }) => {
      const parsedTo = url.parse(to);
      const hostObject = parsedTo.host ? parsedTo : defaultHost;
      const https = hostObject.protocol === 'https:';

      // Just to delegate options to 'express-http-proxy'
      app.use(from, httpProxy(hostObject.host, {
        https,
        proxyReqPathResolver: template(to),
        userResDecorator: transform || fakeUserResDecorator,
        userResHeaderDecorator: transformHeaders || fakeUserResHeaderDecorator
      }));

    });

  }
};

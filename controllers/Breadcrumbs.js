let { startCase } = require('lodash');
let config = require('./../config/default');


/**
 * Get list of breadcrumbs for current request  (usefull with default routing)
 */
module.exports = function () {
  // Available as "page._breadcrumbs"
  if (!this._breadcrumbs) {

    let href = '/';
    let urlPathname = this.location.pathname;
    // Split page URL by "/" and then generate links and titles for each item
    this._breadcrumbs = urlPathname.split('/').map((urlPart) => {
      if (urlPart) {
        let htmlPage = urlPart.endsWith('.html') ? urlPart : config.defaultPageUrl;

        if (!urlPart.endsWith('.html')) {
          href += `${urlPart}/`;
        } else if (htmlPage === config.defaultPageUrl) {
          return null;
        }

        return {
          title: startCase(urlPart.replace(/\.html$/, '')), // User friendly format
          href: href + htmlPage
        };

      } else {
        // Root
        return {
          title: 'Home',
          href: '/'
        };
      }
    }).filter(v => !!v);
  }
};

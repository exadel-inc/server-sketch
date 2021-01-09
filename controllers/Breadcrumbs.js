const { startCase } = require('lodash');
const config = require('./../config/instance');


/**
 * Get list of breadcrumbs for current request  (usefull with default routing)
 */
module.exports = function () {
  // Available as "page._breadcrumbs"
  if (!this._breadcrumbs) {

    let href = '/';
    const urlPathname = this.location.pathname;
    // Split page URL by "/" and then generate links and titles for each item
    this._breadcrumbs = urlPathname.split('/').map((urlPart) => {
      if (urlPart) {
        const htmlPage = urlPart.endsWith('.html') ? urlPart : config.defaultPageUrl;

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

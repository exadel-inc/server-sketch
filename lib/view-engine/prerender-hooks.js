let path = require('path');
let config = require('./../../config/default');

module.exports = {
  // Simple wrapper to replace placeholders in HTML pages with some constants
  process: (content = '', templateOptions = {}) => {
    let { file, options } = templateOptions;
    return content.replace(/%%([\s\S]*?)%%/g, (pattern, hookName) => {
      try {
        return module.exports[hookName]({ file, content, pattern, options });
      } catch (e) {
        return pattern;
      }
    });
  },
  PATH_TO_VIEWS: (options) => {
    let file = path.dirname(options.file);
    return path.relative(file, config.serverViews);
  },
  PATH_TO_BUILTIN_VIEWS: (options) => {
    let file = path.dirname(options.file);
    return path.relative(file, config.localViews);
  }
};

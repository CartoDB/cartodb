const underscoreTemplateLoader = require('underscore-template-strict-loader');

module.exports = {
  process (src, filename, config, options) {
    return underscoreTemplateLoader(src);
  }
};

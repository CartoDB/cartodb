var _ = require('underscore');

module.exports = function unescapeHTML (str) {
  return _.unescape(str);
};

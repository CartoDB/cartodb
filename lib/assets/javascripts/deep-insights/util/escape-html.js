var _ = require('underscore');

module.exports = function escapeHTML (str) {
  return _.escape(str);
};

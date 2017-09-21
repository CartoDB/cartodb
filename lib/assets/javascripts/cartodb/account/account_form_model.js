var cdb = require('cartodb.js-v3');

module.exports = cdb.core.Model.extend({
  url: cdb.config.prefixUrl() + '/api/v3/me'
});

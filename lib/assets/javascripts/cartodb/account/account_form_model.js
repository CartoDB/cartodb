var cdb = require('cartodb.js-v3');

module.exports = cdb.core.Model.extend({
  url: '/api/v3/me'
});

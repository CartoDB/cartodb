var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({
  idAttribute: 'name'
});

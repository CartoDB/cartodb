var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql',

  parse: function(models) {
    return models.rows;
  }
});


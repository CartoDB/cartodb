var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  url: '//common-data.cartodb.com/api/v1/viz',

  parse: function(models) {
    return models.visualizations;
  },

  fetch: function(opts) {
    Backbone.Collection.prototype.fetch.call(this, { data: opts });
  }

});

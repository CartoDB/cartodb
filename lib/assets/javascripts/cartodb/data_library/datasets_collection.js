var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  url: function() {
    return '//' + cdb.config.get('data_library_user') + '.' + cdb.config.get('account_host') + '/api/v1/viz';
  },

  parse: function(models) {
    return models.visualizations;
  },

  fetch: function(opts) {
    Backbone.Collection.prototype.fetch.call(this, { data: opts });
  }

});

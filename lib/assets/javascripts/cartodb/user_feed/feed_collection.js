var Backbone = require('backbone-cdb-v3');

module.exports = Backbone.Collection.extend({
  url: '/api/v1/viz',
  parse: function(models) {
    this.total_entries = models.total_entries;
    return models.visualizations;
  }
});

var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  url: '/api/v1/viz',
  parse: function(models) {
    this.total_entries = models.total_entries;
    return models.visualizations;
  }
});

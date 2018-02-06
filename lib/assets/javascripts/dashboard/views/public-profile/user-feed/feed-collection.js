var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  url: '/api/v1/viz',

  parse: function (models) {
    this.total_entries = models.total_entries;
    return models.visualizations;
  },

  initialize: function (models, options) {
    if (!options.config) {
      throw new Error('config model is required for feed collection');
    }

    this._config = options.config;
  }
});

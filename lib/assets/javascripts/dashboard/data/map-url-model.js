const UrlModel = require('dashboard/data/url-model');

/**
 * URL for a map (derived vis).
 */
const MapUrlModel = UrlModel.extend({

  edit: function () {
    return this.urlToPath('map');
  },

  public: function () {
    return this.urlToPath('public_map');
  },

  deepInsights: function () {
    return this.urlToPath('deep-insights');
  }
});

module.exports = MapUrlModel;

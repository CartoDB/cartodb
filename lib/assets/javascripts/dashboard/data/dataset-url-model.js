const UrlModel = require('dashboard/data/url-model');

/**
 * URL for a dataset (standard vis).
 */
const DatasetUrlModel = UrlModel.extend({

  edit: function () {
    return this.urlToPath();
  },

  public: function () {
    return this.urlToPath('public');
  }
});

module.exports = DatasetUrlModel;

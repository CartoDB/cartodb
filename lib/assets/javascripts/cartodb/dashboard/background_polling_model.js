var cdb = require('cartodb.js');
var BackgroundPollingModel = require('../common/background_polling/background_polling_model');

/**
 *  Background polling model for the dashboard context.
 */

module.exports = BackgroundPollingModel.extend({

  defaults: {
    showSuccessDetailsButton: false,
    geocodingsPolling: false,
    importsPolling: true
  },

  _onImportsStateChange: function(importsModel) {
    // Redirect to dataset/map url?
    if (!this.get('importLimit') &&
        ( this.importsCollection.size() - this.importsCollection.failedItems().length ) === 1 &&
        importsModel.get('state') === 'complete' &&
        importsModel.imp.get('tables_created_count') === 1 &&
        importsModel.imp.get('service_name') !== 'twitter_search') {
      var vis = importsModel.importedVis();
      if (vis) {
        this._redirectTo(encodeURI(vis.viewUrl(this.user).edit()));
      }
    }
  },

  _redirectTo: function(url) {
    window.location = url;
  }

});

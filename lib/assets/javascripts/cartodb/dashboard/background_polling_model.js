var BackgroundPollingModel = require('../common/background_polling/background_polling_model');

/**
 *  Background polling model for the dashboard context.
 */
module.exports = BackgroundPollingModel.extend({

  _onImportsStateChange: function (importsModel) {
    if (importsModel.hasCompleted()) {
      // Redirect to dataset/map url?
      if ((this.importsCollection.size() - this.importsCollection.failedItems().length) === 1 &&
          importsModel.imp.get('tables_created_count') === 1 &&
          importsModel.imp.get('service_name') !== 'twitter_search') {
        var vis = importsModel.importedVis();
        if (vis) {
          this._redirectTo(encodeURI(vis.viewUrl(this.user).edit()));
          return;
        }
      }

      this.trigger('importCompleted', importsModel, this);
    }
  },

  _redirectTo: function (url) {
    window.location = url;
  }
});

var cdb = require('cartodb.js');

/**
 * Background importer model for the dashboard context.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    showSuccessDetailsButton: true
  },

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.importsCollection = opts.importsCollection;
    this.importsCollection.bind('change:state', this._onImportsStateChange, this);
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

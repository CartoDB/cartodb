var cdb = require('cartodb.js');
var ImportsCollection = require('../common/background_polling/models/imports_collection');
var GeocodingsCollection = require('../common/background_polling/models/geocodings_collection');
var BackgroundPollingModel = require('../common/background_polling/background_polling_model');


/**
 *  Background importer model for the editor context.
 *
 */

module.exports = BackgroundPollingModel.extend({

  defaults: {
    showSuccessDetailsButton: false,
    geocodingsPolling: false,
    importsPolling: false
  },

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.vis = opts.vis;
    this.importsCollection = opts.importsCollection || new ImportsCollection(null, { user: this.user });
    this.geocodingsCollection = opts.geocodingsCollection || new GeocodingsCollection(null, { user: this.user });
    this._initBinds();
  },

  _onImportsStateChange: function(importsModel) {
    if (importsModel.hasCompleted()) {
      var self = this;
      this.vis.map.addCartodbLayerFromTable(importsModel.imp.get('table_name'), this.user.get('username'), {
        vis: this.vis,
        success: function() {
          // layers need to be saved because the order may changed
          self.vis.map.layers.saveLayers();
          self.importsCollection.remove(importsModel);
        },
        error: function() {
          self.trigger('importLayerFail', 'Failed to add the connected dataset as a layer to this map');
          self.importsCollection.remove(importsModel);
        }
      });
    }
  }

});

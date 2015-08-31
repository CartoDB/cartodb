var cdb = require('cartodb.js');
var ImportsCollection = require('../common/background_polling/models/imports_collection');
var GeocodingsCollection = require('../common/background_polling/models/geocodings_collection');
var BackgroundPollingModel = require('../common/background_polling/background_polling_model');


/**
 *  Background importer model for the editor context.
 *
 */

module.exports = BackgroundPollingModel.extend({

  _onImportsStateChange: function(importsModel) {
    if (importsModel.hasCompleted()) {
      this.trigger('importCompleted', importsModel, this);
      var self = this;
      this.vis.map.addCartodbLayerFromTable(importsModel.imp.get('table_name'), this.user.get('username'), {
        vis: this.vis,
        success: function() {
          // layers need to be saved because the order may changed
          self.vis.map.layers.saveLayers();
          // Don't remove import item if it is Twitter type
          var serviceName = importsModel.get('upload').service_name;
          var twitterImport = serviceName && serviceName === "twitter_search";
          if (!twitterImport) {
            self.importsCollection.remove(importsModel);  
          }
        },
        error: function() {
          self.trigger('importLayerFail', 'Failed to add the connected dataset as a layer to this map');
          self.importsCollection.remove(importsModel);
        }
      });
    }
  },

  _onGeocodingsStateChange: function(geocodingModel) {
    if (geocodingModel.hasCompleted()) {
      this.trigger('geocodingCompleted', geocodingModel, this);
    }
    if (geocodingModel.hasFailed()) {
      this.trigger('geocodingFailed', geocodingModel, this);
    }
  },

  _onAnalysisStateChange: function(mdl, collection) {}

});

var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var TileJSONView = require('./tile_json_view');

/**
 * View model for TileJSON tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'tile_json',
    label: 'TileJSON',
    layer: undefined // will be set when valid
  },

  createView: function() {
    this.set({
      layer: undefined
    });
    return new TileJSONView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function(baseLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(baseLayers.custom(), function(customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  }
});

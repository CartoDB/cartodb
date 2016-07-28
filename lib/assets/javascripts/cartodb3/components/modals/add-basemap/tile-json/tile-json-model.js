var Backbone = require('backbone');
var _ = require('underscore');
var TileJSONView = require('./tile-json-view');

/**
 * View model for TileJSON tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'tile_json',
    label: 'TileJSON',
    layer: undefined // will be set when valid
  },

  createView: function () {
    return new TileJSONView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function (userLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(userLayers.custom(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  }

});

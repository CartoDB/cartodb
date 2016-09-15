var Backbone = require('backbone');
var _ = require('underscore');
var TileJSONView = require('./tilejson-view');

/**
 * View model for TileJSON tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'tilejson',
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
    return _.any(userLayers.isCustomCategory(), function (customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  }

});

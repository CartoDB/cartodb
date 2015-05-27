var cdb = require('cartodb.js');
var MapboxView = require('./mapbox_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'mapbox',
    label: 'Mapbox',
    layer: undefined // will be set when valid
  },

  createView: function() {
    return new MapboxView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function(baseLayers) {
    // TODO: implement how?
    return false;
  }
});

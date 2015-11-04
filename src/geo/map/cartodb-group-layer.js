var MapLayer = require('./map-layer');
var Layers = require('./layers');

var CartoDBGroupLayer = MapLayer.extend({

  defaults: {
    visible: true,
    type: 'layergroup'
  },

  initialize: function() {
    this.sublayers = new Layers();
  },

  isEqual: function() {
    return false;
  },

  contains: function(layer) {
    return layer.get('type') === 'cartodb';
  }
});

module.exports = CartoDBGroupLayer;

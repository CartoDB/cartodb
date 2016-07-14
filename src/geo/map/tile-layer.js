var LayerModelBase = require('./layer-model-base');

var TileLayer = LayerModelBase.extend({
  defaults: {
    type: 'Tiled',
    visible: true
  }
});

module.exports = TileLayer;

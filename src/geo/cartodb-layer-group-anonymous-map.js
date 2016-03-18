var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');

var CartoDBLayerGroupAnonymousMap = CartoDBLayerGroupBase.extend({
  defaults: {
    type: 'layergroup'
  },

  _convertToWindshaftLayerIndex: function (layerIndex) {
    var layers = {};
    var i = 0;
    this.layers.each(function (layer, index) {
      if (layer.isVisible()) {
        layers[index] = i;
        i++;
      }
    });
    var index = layers[layerIndex];
    if (index === undefined) {
      index = -1;
    }

    return index;
  },

  _convertToMapnikLayerIndex: function (layerIndex) {
    return this._convertToWindshaftLayerIndex(layerIndex);
  }
});

module.exports = CartoDBLayerGroupAnonymousMap;

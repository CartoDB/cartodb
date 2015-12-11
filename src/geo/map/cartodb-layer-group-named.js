var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');

var CartoDBLayerGroupNamed = CartoDBLayerGroupBase.extend({

  defaults: {
    type: 'namedmap'
  },

  _getIndexOfVisibleLayer: function(layerIndex) {
    return layerIndex
    var layers = {};
    var i = 0;
    this.layers.each(function(layer, index) {
      if(layer.isVisible()) {
        layers[index] = i;
        i++;
      }
    });
    var index = layers[layerIndex];
    if (index === undefined) {
      index = -1;
    }

    return index;
  }
});

module.exports = CartoDBLayerGroupNamed;

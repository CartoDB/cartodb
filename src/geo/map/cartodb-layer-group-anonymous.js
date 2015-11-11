var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');

var CartoDBLayerGroupAnonymous = CartoDBLayerGroupBase.extend({

  defaults: {
    type: 'layergroup'
  },

  // Returns the position of a visible layer in relation to all layers when the map is 
  // an "Anonymous Map". For example, if there are two CartoDB layers and layer #0 is
  // hidden, this method would return -1 for #0 and 0 for layer #1.
  _getIndexOfVisibleLayer: function(layerIndex) {
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

module.exports = CartoDBLayerGroupAnonymous;

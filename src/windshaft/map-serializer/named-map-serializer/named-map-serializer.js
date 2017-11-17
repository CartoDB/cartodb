var _ = require('underscore');
var LayerTypes = require('../../../geo/map/layer-types');

/**
 * Transform a map visualization into a json payload compatible with the windshaft API.
 */
function serialize (layersCollection, dataviewsCollection) {
  // Named map templates include both http, cartodb and torque layers
  // so we need to iterate through all the layers in the collection to
  // get the indexes rights. Templates are not aware of Google Maps
  // base layers, so we have to ignore them to get indexes right.
  var layers = layersCollection.filter(function (layer) {
    return !LayerTypes.isGoogleMapsBaseLayer(layer);
  });

  return {
    buffersize: {
      mvt: 0
    },
    styles: _getStylesFromLayers(layers)
  };
}

function _getStylesFromLayers (layers) {
  return _.reduce(layers, function (styles, layer, index) {
    if (layer.get('cartocss')) {
      styles[index] = layer.get('cartocss');
    }
    return styles;
  }, {});
}

module.exports = {
  serialize: serialize
};

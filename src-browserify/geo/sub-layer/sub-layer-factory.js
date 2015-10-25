var CartoDBSubLayer = require('./cartodb-sub-layer');
var HttpSubLayer = require('./http-sub-layer');

function SubLayerFactory() {};

SubLayerFactory.createSublayer = function(type, layer, position) {
  type = type && type.toLowerCase();
  if (!type || type === 'mapnik' || type === 'cartodb') {
    return new CartoDBSubLayer(layer, position);
  } else if (type === 'http') {
    return new HttpSubLayer(layer, position);
  } else {
    throw 'Sublayer type not supported';
  }
};

module.exports = SubLayerFactory;

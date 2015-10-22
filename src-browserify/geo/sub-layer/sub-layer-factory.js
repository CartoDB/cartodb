module.exports = function(CartoDBSubLayer, HttpSubLayer) {
  if (!CartoDBSubLayer) throw new Error('CartoDBSubLayer is required');
  if (!HttpSubLayer) throw new Error('HttpSubLayer is required');

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

  return SubLayerFactory;
};

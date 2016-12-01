var Map = require('../../../../src/geo/map');

module.exports = function (MapView) {
  if (!MapView) throw new Error('MapView is required');

  var map = new Map(null, {
    layersFactory: {}
  });
  return new MapView({
    map: map,
    layerGroupModel: {}
  });
};

var CartoDBLayerGroupBase = require('./cartodb-layer-group-base');

var CartoDBLayerGroupNamedMap = CartoDBLayerGroupBase.extend({
  defaults: {
    type: 'namedmap'
  },

  _convertToWindshaftLayerIndex: function (layerIndex) {
    return ++layerIndex;
  },

  _convertToMapnikLayerIndex: function (layerIndex) {
    return layerIndex;
  }
});

module.exports = CartoDBLayerGroupNamedMap;

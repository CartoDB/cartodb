var TILED_LAYER_TYPE = 'Tiled';
var PLAIN_LAYER_TYPE = 'Plain';
var CARTODB_LAYER_TYPE = 'CartoDB';
var TORQUE_LAYER_TYPE = 'torque';

var isLayerOfType = function (layerModel, layerType) {
  return layerModel.get('type') === layerType;
};

module.exports = {
  isTiledLayer: function (layerModel) {
    return isLayerOfType(layerModel, TILED_LAYER_TYPE);
  },

  isPlainLayer: function (layerModel) {
    return isLayerOfType(layerModel, PLAIN_LAYER_TYPE);
  },

  isCartoDBLayer: function (layerModel) {
    return isLayerOfType(layerModel, CARTODB_LAYER_TYPE);
  },

  isTorqueLayer: function (layerModel) {
    return isLayerOfType(layerModel, TORQUE_LAYER_TYPE);
  }
};

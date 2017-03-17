var TILED_LAYER_TYPE = 'Tiled';
var PLAIN_LAYER_TYPE = 'Plain';
var WMS_LAYER_TYPE = 'WMS';
var GMAPS_BASE_LAYER_TYPE = 'GMapsBase';
var CARTODB_LAYER_TYPE = 'CartoDB';
var TORQUE_LAYER_TYPE = 'torque';

var isLayerOfType = function (layerModel, layerType) {
  return layerModel.get('type').toLowerCase() === layerType.toLowerCase();
};

module.exports = {
  isTiledLayer: function (layerModel) {
    return isLayerOfType(layerModel, TILED_LAYER_TYPE);
  },

  isPlainLayer: function (layerModel) {
    return isLayerOfType(layerModel, PLAIN_LAYER_TYPE);
  },

  isWMSLayer: function (layerModel) {
    return isLayerOfType(layerModel, WMS_LAYER_TYPE);
  },

  isGoogleMapsBaseLayer: function (layerModel) {
    return isLayerOfType(layerModel, GMAPS_BASE_LAYER_TYPE);
  },

  isCartoDBLayer: function (layerModel) {
    return isLayerOfType(layerModel, CARTODB_LAYER_TYPE);
  },

  isTorqueLayer: function (layerModel) {
    return isLayerOfType(layerModel, TORQUE_LAYER_TYPE);
  }
};

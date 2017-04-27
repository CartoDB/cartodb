var _ = require('underscore');
var log = require('cdb.log');
var LeafletTiledLayerView = require('./leaflet-tiled-layer-view');
var LeafletWMSLayerView = require('./leaflet-wms-layer-view');
var LeafletPlainLayerView = require('./leaflet-plain-layer-view');
var LeafletCartoDBLayerGroupView = require('./leaflet-cartodb-layer-group-view');
var LeafletTorqueLayerView = require('./leaflet-torque-layer-view');
var LeafletCartoDBWebglLayerGroupView = require('./leaflet-cartodb-webgl-layer-group-view');
var TangramCartoCSS = require('tangram-cartocss');
var RenderModes = require('../../vis/render-modes');

var MAX_NUMBER_OF_FEATURES_FOR_WEBGL = 10e4;

var LayerGroupViewConstructor = function (layerGroupModel, nativeMap, mapModel, settingsModel) {
  if (canMapBeRenderedClientSide(mapModel, settingsModel)) {
    return new LeafletCartoDBWebglLayerGroupView(layerGroupModel, nativeMap);
  }

  return new LeafletCartoDBLayerGroupView(layerGroupModel, nativeMap);
};

var canMapBeRenderedClientSide = function (mapModel, settingsModel) {
  var mapRenderMode = settingsModel.get('renderMode');

  if (mapRenderMode === RenderModes.VECTOR) {
    return true;
  }

  if (mapRenderMode === RenderModes.RASTER) {
    return false;
  }

  // mapRenderMode === RenderModes.AUTO
  return mapModel.getNumberOfFeatures() < MAX_NUMBER_OF_FEATURES_FOR_WEBGL &&
    _.all(mapModel.layers.getCartoDBLayers(), canLayerBeRenderedClientSide);
};

var canLayerBeRenderedClientSide = function (layerModel) {
  var cartoCSS = layerModel.get('meta').cartocss;
  try {
    TangramCartoCSS.carto2Draw(cartoCSS);
  } catch (e) {
    log.error("[Tangram] Unable to render layer with the following cartoCSS:\n" + cartoCSS);
    return false;
  }

  return true;
};

var LeafletLayerViewFactory = function () {};

LeafletLayerViewFactory.prototype._constructors = {
  'tiled': LeafletTiledLayerView,
  'wms': LeafletWMSLayerView,
  'plain': LeafletPlainLayerView,
  'layergroup': LayerGroupViewConstructor,
  'torque': LeafletTorqueLayerView
};

LeafletLayerViewFactory.prototype.createLayerView = function (layerModel, nativeMap, mapModel, settingsModel) {
  var layerType = layerModel.get('type').toLowerCase();
  var LayerViewClass = this._constructors[layerType];

  if (LayerViewClass) {
    try {
      return new LayerViewClass(layerModel, nativeMap, mapModel, settingsModel);
    } catch (e) {
      log.error("Error creating an instance of layer view for '" + layerType + "' layer -> " + e.message);
      throw e;
    }
  } else {
    log.error("Error creating an instance of layer view for '" + layerType + "' layer. Type is not supported");
  }
};

module.exports = LeafletLayerViewFactory;

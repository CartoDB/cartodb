var log = require('cdb.log');
var LeafletTiledLayerView = require('./leaflet-tiled-layer-view');
var LeafletWMSLayerView = require('./leaflet-wms-layer-view');
var LeafletPlainLayerView = require('./leaflet-plain-layer-view');
var LeafletCartoDBLayerGroupView = require('./leaflet-cartodb-layer-group-view');
var LeafletTorqueLayerView = require('./leaflet-torque-layer-view');
var RenderModes = require('../../geo/render-modes');

var LayerGroupViewConstructor = function (layerGroupModel, opts) {
  opts = opts || {};
  if (opts.mapModel.get('renderMode') === RenderModes.VECTOR) {
    console.warn('Vector rendering is not supported anymore');
  }
  return new LeafletCartoDBLayerGroupView(layerGroupModel, opts);
};

var LeafletLayerViewFactory = function () { };

LeafletLayerViewFactory.prototype._constructors = {
  'tiled': LeafletTiledLayerView,
  'wms': LeafletWMSLayerView,
  'plain': LeafletPlainLayerView,
  'layergroup': LayerGroupViewConstructor,
  'torque': LeafletTorqueLayerView
};

LeafletLayerViewFactory.prototype.createLayerView = function (layerModel, opts) {
  var layerType = layerModel.get('type').toLowerCase();
  var LayerViewClass = this._constructors[layerType];

  if (LayerViewClass) {
    try {
      return new LayerViewClass(layerModel, opts);
    } catch (error) {
      log.error("Error creating an instance of layer view for '" + layerType + "' layer -> " + error.message);
      throw error;
    }
  } else {
    log.error("Error creating an instance of layer view for '" + layerType + "' layer. Type is not supported");
  }
};

module.exports = LeafletLayerViewFactory;

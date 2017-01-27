var log = require('cdb.log');
var LeafletTiledLayerView = require('./leaflet-tiled-layer-view');
var LeafletWMSLayerView = require('./leaflet-wms-layer-view');
var LeafletPlainLayerView = require('./leaflet-plain-layer-view');
var LeafletGmapsTiledLayerView = require('./leaflet-gmaps-tiled-layer-view');
var LeafletCartoDBLayerGroupView = require('./leaflet-cartodb-layer-group-view');
var LeafletTorqueLayerView = require('./leaflet-torque-layer-view');
var LeafletCartoDBVectorLayerGroupView = require('./leaflet-cartodb-vector-layer-group-view');
var LeafletCartoDBWebglLayerGroupView = require('./leaflet-cartodb-webgl-layer-group-view');

var LayerGroupViewConstructor = function (layerGroupModel, mapModel, options) {
  if (options.webgl) {
    return new LeafletCartoDBWebglLayerGroupView(layerGroupModel, mapModel);
  } else if (options.vector) {
    var layerView = new LeafletCartoDBVectorLayerGroupView(layerGroupModel, mapModel);

    return layerView;
  }
  return new LeafletCartoDBLayerGroupView(layerGroupModel, mapModel);
};

var LeafletLayerViewFactory = function (options) {
  options = options || {};
  this._vector = options.vector;
  this._webgl = options.webgl;
};

LeafletLayerViewFactory.prototype._constructors = {
  'tiled': LeafletTiledLayerView,
  'wms': LeafletWMSLayerView,
  'plain': LeafletPlainLayerView,
  'gmapsbase': LeafletGmapsTiledLayerView,
  'layergroup': LayerGroupViewConstructor,
  'torque': LeafletTorqueLayerView
};

LeafletLayerViewFactory.prototype.createLayerView = function (layerModel, mapModel) {
  var layerType = layerModel.get('type').toLowerCase();
  var LayerViewClass = this._constructors[layerType];

  if (LayerViewClass) {
    try {
      return new LayerViewClass(layerModel, mapModel, {
        vector: this._vector,
        webgl: this._webgl
      });
    } catch (e) {
      log.error("Error creating an instance of layer view for '" + layerType + "' layer -> " + e.message);
      throw e;
    }
  } else {
    log.error("Error creating an instance of layer view for '" + layerType + "' layer. Type is not supported");
  }
};

module.exports = LeafletLayerViewFactory;

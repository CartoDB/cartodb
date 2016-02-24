var log = require('cdb.log');
var LeafletTiledLayerView = require('./leaflet-tiled-layer-view');
var LeafletWMSLayerView = require('./leaflet-wms-layer-view');
var LeafletPlainLayerView = require('./leaflet-plain-layer-view');
var LeafletGmapsTiledLayerView = require('./leaflet-gmaps-tiled-layer-view');
var LeafletCartoDBLayerGroupView = require('./leaflet-cartodb-layer-group-view');
var LeafletCartoDBVectorLayerGroupView = require('./leaflet-cartodb-vector-layer-group-view');

var LayerGroupViewConstructor = function (layerGroupModel, mapModel, options) {
  if (options.vector) {
    var layerView = new LeafletCartoDBVectorLayerGroupView(layerGroupModel, mapModel);

    return layerView;
  }
  return new LeafletCartoDBLayerGroupView(layerGroupModel, mapModel);
};

var LeafletLayerViewFactory = function (options) {
  this._vector = options.vector;
};

LeafletLayerViewFactory.prototype._constructors = {
  'tiled': LeafletTiledLayerView,
  'wms': LeafletWMSLayerView,
  'plain': LeafletPlainLayerView,
  'gmapsbase': LeafletGmapsTiledLayerView,
  'layergroup': LayerGroupViewConstructor,
  'namedmap': LayerGroupViewConstructor,
  'torque': function (layer, map) {
    // TODO for now adding this error to be thrown if object is not present, since it's dependency
    // is not included in the standard bundle
    if (!cdb.geo.LeafletTorqueLayer) {
      throw new Error('torque library must have been loaded for a torque layer to work');
    }
    return new cdb.geo.LeafletTorqueLayer(layer, map);
  }
};

LeafletLayerViewFactory.prototype.createLayerView = function (layerModel, mapModel) {
  var layerType = layerModel.get('type').toLowerCase();
  var LayerViewClass = this._constructors[layerType];

  if (LayerViewClass) {
    try {
      return new LayerViewClass(layerModel, mapModel, {
        vector: this._vector
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

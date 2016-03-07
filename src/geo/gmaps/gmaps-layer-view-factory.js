/* global google */
var log = require('cdb.log');

var GMapsLayerViewFactory = function () {};

var constructors = {};

// Only "register" the layer view mappings if Google Maps library is present
if (typeof (google) !== 'undefined' && typeof (google.maps) !== 'undefined') {
  var GMapsBaseLayerView = require('./gmaps-base-layer-view');
  var GMapsTiledLayerView = require('./gmaps-tiled-layer-view');
  var LeafletWMSLayerView = require('../leaflet/leaflet-wms-layer-view');
  var GMapsPlainLayerView = require('./gmaps-plain-layer-view');
  var GMapsCartoDBLayerGroupView = require('./gmaps-cartodb-layer-group-view');
  var GMapsTorqueLayerView = require('./gmaps-torque-layer-view');

  constructors = {
    'tiled': GMapsTiledLayerView,
    'wms': LeafletWMSLayerView,
    'plain': GMapsPlainLayerView,
    'gmapsbase': GMapsBaseLayerView,
    'layergroup': GMapsCartoDBLayerGroupView,
    'namedmap': GMapsCartoDBLayerGroupView,
    'torque': GMapsTorqueLayerView
  };
}

GMapsLayerViewFactory.prototype._constructors = constructors;

GMapsLayerViewFactory.prototype.createLayerView = function (layerModel, mapModel) {
  var layerType = layerModel.get('type').toLowerCase();
  var LayerViewClass = this._constructors[layerType];

  if (LayerViewClass) {
    try {
      return new LayerViewClass(layerModel, mapModel);
    } catch (e) {
      log.error("Error creating an instance of layer view for '" + layerType + "' layer -> " + e.message);
      throw e;
    }
  } else {
    log.error("Error creating an instance of layer view for '" + layerType + "' layer. Type is not supported");
  }
};

module.exports = GMapsLayerViewFactory;

/* global L */
require('torque.js');
var _ = require('underscore');
var LeafletLayerView = require('./leaflet-layer-view');
var TorqueLayerViewBase = require('../torque-layer-view-base');
var util = require('cdb.core.util');

var LeafletTorqueLayer = function (layerModel, leafletMap) {
  LeafletLayerView.apply(this, arguments);
  this.setNativeTorqueLayer(this.leafletLayer);
};

LeafletTorqueLayer.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  TorqueLayerViewBase,
  {
    _createLeafletLayer: function (layerModel) {
      var query = this._getQuery(layerModel);
      var attrs = this._initialAttrs(layerModel);

      _.extend(attrs, {
        dynamic_cdn: layerModel.get('dynamic_cdn'),
        instanciateCallback: function () {
          var cartocss = layerModel.get('cartocss') || layerModel.get('tile_style');
          return '_cdbct_' + util.uniqueCallbackName(cartocss + query);
        }
      });

      return new L.TorqueLayer(attrs);
    }
  }
);

module.exports = LeafletTorqueLayer;

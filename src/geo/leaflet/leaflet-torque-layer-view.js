/* global L */
require('torque.js');
var _ = require('underscore');
var LeafletLayerView = require('./leaflet-layer-view');
var TorqueLayerViewBase = require('../torque-layer-view-base');
var util = require('cdb.core.util');

var LeafletTorqueLayer = function (layerModel, opts) {
  LeafletLayerView.apply(this, arguments);
  this.setNativeTorqueLayer(this.leafletLayer);
};

LeafletTorqueLayer.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  TorqueLayerViewBase,
  {
    _createLeafletLayer: function () {
      var query = this._getQuery(this.model);
      var attrs = this._initialAttrs(this.model);

      _.extend(attrs, {
        dynamic_cdn: this.model.get('dynamic_cdn'),
        showLimitErrors: this.showLimitErrors,
        instanciateCallback: function () {
          var cartocss = this.model.get('cartocss') || this.model.get('tile_style');
          return '_cdbct_' + util.uniqueCallbackName(cartocss + query);
        }.bind(this)
      });

      return new L.TorqueLayer(attrs);
    }
  }
);

module.exports = LeafletTorqueLayer;

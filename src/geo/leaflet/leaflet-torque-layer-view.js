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
    },

    _modelUpdated: function () {
      var model = this.model;

      if (!model.changedAttributes()) return;

      if (model.hasChanged('visible')) {
        model.get('visible') ? this.leafletLayer.show() : this.leafletLayer.hide();
      }

      if (model.hasChanged('cartocss')) {
        this.leafletLayer.setCartoCSS(model.get('cartocss'));
      }

      if (model.hasChanged('tileURLTemplates')) {
        this.leafletLayer.provider.templateUrl = model.getTileURLTemplates()[0];
        this.leafletLayer.provider.options.subdomains = model.get('subdomains');
        // set meta
        var meta = model.get('meta');
        _.extend(this.leafletLayer.provider.options, meta);
        model.set(meta);
        // this needs to be deferred in order to break the infinite loop
        // of setReady changing keys and keys updating the model
        // If we do this in the next iteration 'tileURLTemplates' will not be in changedAttributes
        // so this will not pass through this code
        setTimeout(function () {
          this.leafletLayer.provider._setReady(true);
          this.leafletLayer._reloadTiles();
        }.bind(this), 0);
      }
    }
  }
);

module.exports = LeafletTorqueLayer;

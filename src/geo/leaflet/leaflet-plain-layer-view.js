/* global L */
var _ = require('underscore');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletPlainLayerView = function (layerModel, opts) {
  LeafletLayerView.apply(this, arguments);
};

LeafletPlainLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function () {
      var leafletLayer = new L.Layer();

      leafletLayer.onAdd = function () {
        this._redraw();
      }.bind(this);

      leafletLayer.onRemove = function () {
        var div = this.leafletMap.getContainer();
        div.style.background = 'none';
      }.bind(this);

      leafletLayer.setZIndex = function () {};

      return leafletLayer;
    },

    _modelUpdated: function () {
      this._redraw();
    },

    _redraw: function () {
      var div = this.leafletMap.getContainer();
      div.style.backgroundColor = this.model.get('color') || '#FFF';

      if (this.model.get('image')) {
        var style = 'transparent url(' + this.model.get('image') + ') repeat center center';
        div.style.background = style;
      }
    }
  }
);

module.exports = LeafletPlainLayerView;

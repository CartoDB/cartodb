var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletPlainLayerView = function (layerModel, leafletMap) {
  LeafletLayerView.apply(this, arguments);
}

LeafletPlainLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function (layerModel) {
      var self = this;
      var leafletLayer = new L.Layer();

      leafletLayer.onAdd = function () {
        self._redraw();
      };

      leafletLayer.onRemove = function () {
        var div = self.leafletMap.getContainer();
        div.style.background = 'none';
      };

      leafletLayer.setZIndex = function () {};

      return leafletLayer;
    },

    _modelUpdated: function () {
      this._redraw();
    },

    _redraw: function () {
      var div = this.leafletMap.getContainer()
      div.style.backgroundColor = this.model.get('color') || '#FFF';

      if (this.model.get('image')) {
        var style = 'transparent url(' + this.model.get('image') + ') repeat center center';
        div.style.background = style;
      }
    }
  }
);

module.exports = LeafletPlainLayerView;

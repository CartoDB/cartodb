var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletPlainLayerView = function (layerModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);

  this.leafletLayer.onAdd = function () {
    self._redraw();
  };

  this.leafletLayer.onRemove = function () {
    var div = self.leafletMap.getContainer();
    div.style.background = 'none';
  };
}

LeafletPlainLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function (layerModel) {
      return new L.Class();
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

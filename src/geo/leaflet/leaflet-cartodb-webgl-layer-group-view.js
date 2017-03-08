var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var L = require('leaflet');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);

  layerGroupModel.bind('change:urls',
    this._onURLsChanged(layerGroupModel.getTileURLTemplates.bind(layerGroupModel))
  );

  this.tangram = new TC(leafletMap);

  layerGroupModel.each(this._onLayerAdded, this);
  layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));
};

LeafletCartoDBWebglLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function () {
      var leafletLayer = new L.Class();
      leafletLayer.onAdd = function () {};
      leafletLayer.onRemove = function () {};
      leafletLayer.setZIndex = function () {};
      return leafletLayer;
    },

    _onLayerAdded: function (layer, i) {
      var self = this;
      layer.bind('change:meta change:visible', function (e) {
        self.tangram.addLayer(e.attributes, (i + 1));
      });
    },

    _onURLsChanged: function (getUrl) {
      var self = this;
      return function () {
        self.tangram.addDataSource(getUrl('mvt'));
      };
    }
  }
);

module.exports = LeafletCartoDBWebglLayerGroupView;

var _ = require('underscore');
var Backbone = require('backbone');

var LeafletLayerView = function (layerModel, leafletMap, mapModel) {
  this.leafletLayer = this._createLeafletLayer(layerModel);
  this.leafletMap = leafletMap;
  this.model = layerModel;
  this.mapModel = mapModel;

  this.setModel(layerModel);

  var type = layerModel.get('type') || layerModel.get('kind');
  this.type = type && type.toLowerCase();

  this.listenTo(this.leafletLayer, 'tileerror', this._onTileError, this);
};

_.extend(LeafletLayerView.prototype, Backbone.Events);
_.extend(LeafletLayerView.prototype, {

  setZIndex: function (index) {
    this.leafletLayer.setZIndex(index);
  },

  setModel: function (model) {
    if (this.model) {
      this.model.unbind('change', this._modelUpdated, this);
    }
    this.model = model;
    this.model.bind('change', this._modelUpdated, this);
  },

  remove: function () {
    this.leafletMap.removeLayer(this.leafletLayer);
    this.trigger('remove', this);
    this.model.unbind(null, null, this);
    this.unbind();
  },

  reload: function () {
    this.leafletLayer.redraw();
  },

  _onTileError: function (layer) {
    this.mapModel.addErrorTile(layer.tile);
  },

  _createLeafletLayer: function () {
    throw new Error('subclasses of LeafletLayerView must implement _createLeafletLayer');
  }
});

module.exports = LeafletLayerView;

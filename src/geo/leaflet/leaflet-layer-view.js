var _ = require('underscore');
var Backbone = require('backbone');

var LeafletLayerView = function (layerModel, opts) {
  opts = opts || {};
  this.model = layerModel;
  this.mapModel = opts.mapModel;
  this.leafletMap = opts.nativeMap;
  this.leafletLayer = opts.nativeLayer || this._createLeafletLayer();
  this.showLimitErrors = opts.showLimitErrors;

  this.setModel(layerModel);

  var type = layerModel.get('type') || layerModel.get('kind');
  this.type = type && type.toLowerCase();
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
    this.notifyRemove();
  },

  notifyRemove: function () {
    this.trigger('remove', this);
    this.model.unbind(null, null, this);
    this.unbind();
  },

  reload: function () {
    this.leafletLayer.redraw();
  },

  _createLeafletLayer: function () {
    throw new Error('subclasses of LeafletLayerView must implement _createLeafletLayer');
  }
});

module.exports = LeafletLayerView;

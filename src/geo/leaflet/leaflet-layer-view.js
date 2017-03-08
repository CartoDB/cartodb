var _ = require('underscore');
var Backbone = require('backbone');

/**
 * base layer for all leaflet layers
 */
var LeafletLayerView = function (layerModel, leafletMap) {
  this.leafletLayer = this._createLeafletLayer(layerModel);
  this.leafletMap = leafletMap;
  this.model = layerModel;

  this.setModel(layerModel);

  var type = layerModel.get('type') || layerModel.get('kind');
  this.type = type && type.toLowerCase();
};

_.extend(LeafletLayerView.prototype, Backbone.Events);
_.extend(LeafletLayerView.prototype, {

  _createLeafletLayer: function () {
    throw new Error('subclasses of LeafletLayerView must implement _createLeafletLayer');
  },

  setModel: function (model) {
    if (this.model) {
      this.model.unbind('change', this._modelUpdated, this);
    }
    this.model = model;
    this.model.bind('change', this._modelUpdated, this);
  },

  /**
   * remove layer from the map and unbind events
   */
  remove: function () {
    this.leafletMap.removeLayer(this.leafletLayer);
    this.trigger('remove', this);
    this.model.unbind(null, null, this);
    this.unbind();
  },

  reload: function () {
    this.leafletLayer.redraw();
  }
});

module.exports = LeafletLayerView;

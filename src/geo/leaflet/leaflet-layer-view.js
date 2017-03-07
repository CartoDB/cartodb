var _ = require('underscore');
var Backbone = require('backbone');

/**
 * base layer for all leaflet layers
 */
//TODO: Revisit parameters
var LeafletLayerView = function (layerModel, leafletLayer, leafletMap) {
  this.leafletLayer = leafletLayer;
  this.leafletMap = leafletMap;
  this.model = layerModel;

  this.setModel(layerModel);

  var type = layerModel.get('type') || layerModel.get('kind');
  this.type = type && type.toLowerCase();
};

_.extend(LeafletLayerView.prototype, Backbone.Events);
_.extend(LeafletLayerView.prototype, {

  // TODO: Uncomment this
  // _createLeafletLayer: function () {
  //   throw new Error('subclasses of LeafletLayerView must implement _createLeafletLayer');
  // },

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

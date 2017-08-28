var _ = require('underscore');
var Backbone = require('backbone');

/**
 * base layer for all google maps layers
 */
var GMapsLayerView = function (layerModel, gmapsMap, mapModel) {
  this.map = this.gmapsMap = gmapsMap;
  this.model = layerModel;
  this.mapModel = mapModel;
  this.model.bind('change', this._onModelUpdated, this);
};

_.extend(GMapsLayerView.prototype, Backbone.Events);
_.extend(GMapsLayerView.prototype, {
  addToMap: function () {
    throw new Error('Subclasses of GMapsLayerView must implement addToMap');
  },

  remove: function () {
    throw new Error('Subclasses of GMapsLayerView must implement remove');
  },

  _onModelUpdated: function () {},

  _onTileError: function (tileDomNode) {
    this.mapModel.addErrorTile(tileDomNode);
  }
});

module.exports = GMapsLayerView;

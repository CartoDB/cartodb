var _ = require('underscore');
var Backbone = require('backbone');

/**
 * base layer for all google maps layers
 */
var GMapsLayerView = function (layerModel, opts) {
  opts = opts || {};
  this.model = layerModel;
  this.model.bind('change', this._onModelUpdated, this);
  this.mapModel = opts.mapModel;
  this.gmapsMap = opts.nativeMap;
  this.showLimitErrors = opts.showLimitErrors;
};

_.extend(GMapsLayerView.prototype, Backbone.Events);
_.extend(GMapsLayerView.prototype, {
  addToMap: function () {
    throw new Error('Subclasses of GMapsLayerView must implement addToMap');
  },

  remove: function () {
    throw new Error('Subclasses of GMapsLayerView must implement remove');
  },

  _onModelUpdated: function () {}
});

module.exports = GMapsLayerView;

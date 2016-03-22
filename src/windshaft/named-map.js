var _ = require('underscore');
var MapBase = require('./map-base.js');

var NamedMap = MapBase.extend({
  toJSON: function () {
    var json = {};
    _.each(this._getLayers(), function (layerModel, layerIndex) {
      json['layer' + layerIndex] = layerModel.isVisible() ? 1 : 0;
    });
    return json;
  }
});

module.exports = NamedMap;

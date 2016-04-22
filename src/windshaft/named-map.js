var _ = require('underscore');
var MapBase = require('./map-base.js');

var NamedMap = MapBase.extend({
  toJSON: function () {
    var json = {};
    var layers = this._getLayers();
    var styles = options.layers.reduce(function (p,c,i) { 
      var style = c.get('cartocss'); 
      if (style) {
        p[i] = style;
      }
      return p; 
    }, {});
    _.each(layers, function (layerModel, layerIndex) {
      json['layer' + layerIndex] = layerModel.isVisible() ? 1 : 0;
    });
    json.styles = styles;
    return json;
  }
});

module.exports = NamedMap;

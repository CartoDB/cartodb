var _ = require('underscore');
var MapBase = require('./map-base.js');

var NamedMap = MapBase.extend({
  toJSON: function () {
    var json = {};

    _.each(this._getLayers(), function (layerModel, layerIndex) {
      json['layer' + layerIndex] = layerModel.isVisible() ? 1 : 0;
    });

    // Named map templates include both http, cartodb and torque layers
    // so we need to iterate through all the layers in the collection to
    // get the indexes rights. The following assignements generates something like:
    //   {
    //     ...,
    //     styles: {
    //       "2": "/** torque visualization */\n\nMap { ... }"
    //     }
    //   }
    //
    json.styles = this._layersCollection.reduce(function (p, c, i) {
      var style = c.get('cartocss');
      if (style) {
        p[i] = style;
      }
      return p;
    }, {});

    return json;
  }
});

module.exports = NamedMap;

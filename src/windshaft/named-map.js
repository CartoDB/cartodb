var MapBase = require('./map-base.js');
var _ = require('underscore');
var LayerTypes = require('../geo/map/layer-types');

var NamedMap = MapBase.extend({
  toJSON: function () {
    var json = {
      buffersize: {
        mvt: 0
      }
    };

    // Named map templates include both http, cartodb and torque layers
    // so we need to iterate through all the layers in the collection to
    // get the indexes rights. The following assignements generates something like:
    //   {
    //     ...,
    //     styles: {
    //       "2": "/** torque visualization */\n\nMap { ... }"
    //     }
    //   }

    var layers = this._layersCollection.filter(function (layer) {
      return !LayerTypes.isGoogleMapsBaseLayer(layer);
    });

    json.styles = _.reduce(layers, function (memo, layer, index) {
      var style = layer.get('cartocss');
      if (style) {
        memo[index] = style;
      }

      return memo;
    }, {});

    return json;
  }
});

module.exports = NamedMap;

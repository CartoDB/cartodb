var _ = require('underscore');

// NOTE this does not return a Tiles directly, but a wrapper, to inject the dependencies
// e.g. var Tiles = require('./tiles')(LayerDefinition, reqwestCompat);
// @param {Object} LayerDefinition
// @param {Object} reqwestCompat
module.exports = function(LayerDefinition, reqwestCompat) {
  if (!LayerDefinition) throw new Error('LayerDefinition is required');
  if (!reqwestCompat) throw new Error('reqwestCompat is required');

  var defaults = {
    tiler_domain:   "cartodb.com",
    tiler_port:     "80",
    tiler_protocol: "http",
    subdomains: ['{s}'],
    extra_params:   {
      cache_policy: 'persist'
    }
  };

  var Tiles = function(options) {
    _.defaults(options, defaults);
    if(!options.sublayers) {
      throw new Error("sublayers should be passed");
    }
    if(!options.user_name) {
      throw new Error("username should be passed");
    }

    options.layer_definition = LayerDefinition.layerDefFromSubLayers(options.sublayers);

    options.ajax = reqwestCompat;

    LayerDefinition.call(this, options.layer_definition, options);
  };

  _.extend(Tiles.prototype, LayerDefinition.prototype);

  /**
   * return the tile url template for the layer requested
   */
  Tiles.getTiles = function(options, callback) {
    var t = new Tiles(options);
    t.getTiles(callback);
    return t;
  };

  return Tiles;
};

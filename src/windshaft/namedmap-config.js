var _ = require('underscore');
var NamedMapConfig = {};

NamedMapConfig.generate = function (options) {
  var layers = options.layers;
  var styles = options.layers.reduce(function (p,c,i) { 
    var style = c.get('cartocss'); 
    if (style) {
      p[i] = style;
    }
    return p; 
  }, {});
  var config = {};

  _.each(layers, function (layer, index) {
    config['layer' + index] = layer.isVisible() ? 1 : 0;
  });

  config.styles = styles;

  // TODO: We should add the params
  // TODO: We should add the auth_token
  return config;
};

module.exports = NamedMapConfig;

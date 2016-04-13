var _ = require('underscore');
var LayerGroupConfig = {};

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

LayerGroupConfig.generate = function (options) {
  var layers = options.layers;
  var dataviews = options.dataviews;
  var config = { layers: [] };
  _.each(layers, function (layer, index) {
    var provisionalCartoCSS = options.styles[index]
    if (layer.isVisible()) {
      var layerConfig = {
        type: layer.get('type').toLowerCase(),
        options: {
          sql: layer.get('sql'),
          cartocss: provisionalCartoCSS || layer.get('initialStyle') || layer.get('cartocss'),
          cartocss_version: layer.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
          interactivity: layer.getInteractiveColumnNames(),
          // TODO widgets should be renamed to dataviews, requires Windshaft to be changed first though
          widgets: {}
        }
      };

      if (dataviews) {
        layerConfig.options.widgets = dataviews.reduce(function (memo, m) {
          if (layer.get('id') === m.layer.get('id')) {
            memo[m.get('id')] = m.toJSON();
          }
          return memo;
        }, {});
      }

      if (layer.getInfowindowFieldNames().length) {
        layerConfig.options.attributes = {
          id: 'cartodb_id',
          columns: layer.getInfowindowFieldNames()
        };
      }

      config.layers.push(layerConfig);
    }
  });

  return config;
};

module.exports = LayerGroupConfig;

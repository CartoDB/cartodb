var _ = require('underscore');
var WindshaftPublicDashboardConfig = {};

WindshaftPublicDashboardConfig.generate = function (options) {
  var layers = options.layers;
  var dataviews = options.dataviews;
  var config = { layers: [] };
  _.each(layers, function (layer) {
    if (layer.isVisible()) {
      var layerConfig = {
        type: layer.get('type').toLowerCase(),
        options: {
          sql: layer.get('sql'),
          cartocss: layer.get('cartocss'),
          cartocss_version: layer.get('cartocss_version'),
          interactivity: layer.getInteractiveColumnNames()
        }
      };
      if (layer.getInfowindowFieldNames().length) {
        layerConfig.options.attributes = {
          id: 'cartodb_id',
          columns: layer.getInfowindowFieldNames()
        };
      }

      // TODO rename to dataviews once Windshaft is changed
      layerConfig.options.widgets = {};

      var layerId = layer.get('id');
      dataviews.each(function (d) {
        if (layerId === d.layer.get('id')) {
          layerConfig.options.widgets[d.get('id')] = d.toJSON();
        }
      });
      config.layers.push(layerConfig);
    }
  });

  return config;
};

module.exports = WindshaftPublicDashboardConfig;

var _ = require('underscore');
var WindshaftPublicDashboardConfig = {};

WindshaftPublicDashboardConfig.generate = function (options) {
  var layers = options.layers;
  var widgets = options.widgets;
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

      layerConfig.options.widgets = {};
      var layerId = layer.get('id');
      widgets.each(function (widget) {
        if (layerId === widget.layer.get('id')) {
          layerConfig.options.widgets[widget.get('id')] = widget.toJSON();
        }
      });
      config.layers.push(layerConfig);
    }
  });

  return config;
};

module.exports = WindshaftPublicDashboardConfig;

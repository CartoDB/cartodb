var _ = require('underscore');
var WindshaftPublicDashboardConfig = {};

WindshaftPublicDashboardConfig.generate = function(options) {
  var layers = options.layers;
  var config = { layers: [] };
  _.each(layers, function(layer) {
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
          id: "cartodb_id",
          columns: layer.getInfowindowFieldNames()
        };
      }

      if (layer.widgets.length > 0) {
        layerConfig.options.widgets = {};
        layer.widgets.each(function(widget) {
          layerConfig.options.widgets[widget.get('id')] = widget.toJSON();
        });

      }
      config.layers.push(layerConfig);
    }
  });

  return config;
};

module.exports = WindshaftPublicDashboardConfig;

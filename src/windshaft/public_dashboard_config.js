cdb.windshaft.PublicDashboardConfig = {};

cdb.windshaft.PublicDashboardConfig.generate = function(dashboard) {
  var config = {};

  // LAYERS
  config.layers = dashboard.getVisibleLayers().map(function(layerModel, layerIndex) {
    var layerConfig = {
      type: 'cartodb',
      options: {
        sql: layerModel.get('sql'),
        cartocss: layerModel.get('cartocss'),
        cartocss_version: layerModel.get('cartocss_version'),
        interactivity: layerModel.getInteractiveColumnNames()
      }
    };
    if (layerModel.getInfowindowFieldNames().length) {
      layerConfig.options.attributes = {
        id: "cartodb_id",
        columns: layerModel.getInfowindowFieldNames()
      };
    }

    // WIDGETS
    var widgets = layerModel.widgets;
    if (widgets && widgets.length) {
      layerConfig.options.widgets = {};

      widgets.forEach(function(widget) {

        // TODO: Each widget has different options
        layerConfig.options.widgets[widget.get('id')] = widget.toJSON();
      });
    }

    return layerConfig;
  });

  return config;
};
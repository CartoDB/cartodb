cdb.windshaft.PublicDashboardConfig = {};

cdb.windshaft.PublicDashboardConfig.generate = function(dashboard) {
  var config = {};

  // LAYERS
  config.layers = _.map(dashboard.getVisibleLayers(), function(layerModel) {
    var layerConfig = {
      type: 'cartodb',
      options: {
        sql: layerModel.get('sql'),
        cartocss: layerModel.get('cartocss'),
        cartocss_version: layerModel.get('cartocss_version'),
        interactivity: layerModel.getInteractiveColumnNames()
      }
    }
    if (layerModel.getInfowindowFieldNames().length) {
      layerConfig.options.attributes = {
        id: "cartodb_id",
        columns: layerModel.getInfowindowFieldNames()
      }
    }
    return layerConfig;
  })

  // WIDGETS
  var widgets = dashboard.getWidgets();
  if (widgets && widgets.length) {
    config.lists = {};

    // TODO: Add histograms.
    // var lists = _.filter(widgets, function(widget){
    //   return widget.get('type') === 'list'
    // });
    widgets.forEach(function(list) {
      config.lists[list.get('id')] = {
        "sql": list.get('options').sql,
        "columns": list.get('options').columns
      }
    })
  }

  return config;
};
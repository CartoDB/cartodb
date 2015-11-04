cdb.windshaft.PrivateDashboardConfig = {};

cdb.windshaft.PrivateDashboardConfig.generate = function(options) {
  var layers = options.layers;
  var config = {};

  _.each(layers, function(layer, index){
    config['layer' + index] = layer.isVisible() ? 1 : 0;
  });

  // TODO: We should add the params
  // TODO: We should add the auth_token
  return config;
};
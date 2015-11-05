var WindshaftPrivateDashboardConfig = {};

WindshaftPrivateDashboardConfig.generate = function(options) {
  this.layers = options.layers;
  var config = {};

  this.layers.each(function(layer, index){
    config['layer' + index] = layer.isVisible() ? '1' : 0;
  });

  // TODO: We should add the params
  // TODO: We should add the auth_token
  return config;
};

module.exports = WindshaftPrivateDashboardConfig;

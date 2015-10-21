cdb.windshaft.Dashboard = function(options) {
  this.datasource = options.datasource;
  this.cartoDBLayerGroup = options.cartoDBLayerGroup;
  this.widgets = options.widgets;

  this.client = new cdb.windshaft.Client({
    ajax: $.ajax,
    endpoint: this._getEndpoint(), // TODO: This is different for named_maps -> POST /api/v1/map/named/:template_name
    windshaftURLTemplate: this.datasource.maps_api_template,
    userName: this.datasource.user_name,
    statTag: this.datasource.stat_tag,
    forceCors: this.datasource.force_cors
  });

  this.instance = new cdb.windshaft.DashboardInstance();
  this.cartoDBLayerGroup.bindDashboardInstance(this.instance);

  // Bindings
  this.cartoDBLayerGroup.layers.bind('change', this.createInstance, this);
  this.instance.bind('change:layergroupid', this._updateWidgets, this);
}

cdb.windshaft.Dashboard.prototype._updateWidgets = function(dashboardInstance) {
  _.each(this.widgets, function(widget) {
    widget.set({
      dashboardBaseURL: dashboardInstance.getBaseURL(),
    });
  }.bind(this))
}

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var instance = this.client.instantiateMap(this._toDashboardConfig());
  instance.bind('change:layergroupid', function() {
    this.instance.set(instance.toJSON());
  }.bind(this))

  return this.instance;
}

// TODO: This is different for NamedMaps
cdb.windshaft.Dashboard.prototype._toDashboardConfig = function() {

  if (this.datasource.template_name) { // NAMED MAP -> Dashboard with private data
    var config = {};
    this.cartoDBLayerGroup.layers.each(function(layer, index){
      config['layer' + index] = layer.isVisible() ? '1' : 0;
    });
    // TODO: We should add the params
    // TODO: We should add the auth_token
  } else {
    var config = {
      version: '1.4.0',
      stat_tag: this.datasource.stat_tag
    }

    // LAYERS
    config.layers = _.map(this.cartoDBLayerGroup.getVisibleLayers(), function(layerModel) {
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
    if (this.widgets && this.widgets.length) {
      config.lists = {};

      var lists = _.filter(this.widgets, function(widget){
        return widget.get('type') === 'list'
      });

      lists.forEach(function(list) {
        config.lists[list.get('id')] = {
          "sql": list.get('options').sql,
          "columns": list.get('options').columns
        }
      })
    }
  }

  return config;
}

cdb.windshaft.Dashboard.prototype._getEndpoint = function() {
  if (this.datasource.template_name) { // NAMED MAP -> Dashboard with private data
    return [cdb.windshaft.config.MAPS_API_BASE_URL, 'named', this.datasource.template_name].join('/');
  }
  return cdb.windshaft.config.MAPS_API_BASE_URL;
}

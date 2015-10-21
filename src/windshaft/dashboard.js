cdb.windshaft.Dashboard = function(options) {
  this.datasource = options.datasource;
  this.cartoDBLayerGroup = options.cartoDBLayerGroup;
  this.widgets = options.widgets;

  this.client = new cdb.windshaft.Client({
    ajax: $.ajax,
    endpoint: cdb.windshaft.config.MAPS_API_BASE_URL, // TODO: This is different for named_maps -> POST /api/v1/map/named/:template_name
    windshaftURLTemplate: this.datasource.maps_api_template,
    userName: this.datasource.user_name,
    statTag: this.datasource.stat_tag,
    forceCors: this.datasource.force_cors
  });

  this.instance = new cdb.windshaft.DashboardInstance();

  // Bindings
  this.cartoDBLayerGroup.layers.bind('change', this.createInstance, this);
  this.instance.bind('change:layergroupid', this._updateLayerGroup, this);
  this.instance.bind('change:layergroupid', this._updateWidgets, this);
}

cdb.windshaft.Dashboard.prototype._updateLayerGroup = function(dashboardInstance) {
  this.cartoDBLayerGroup.set({
    dashboardBaseURL: dashboardInstance.getBaseURL(),
    urls: dashboardInstance.getTiles()
  })
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
  return {
    toJSON: function() {

      var config = {
        version: '1.4.0',
        stat_tag: this.datasource.stat_tag
      }

      // LAYERS
      var layers = _.map(this.cartoDBLayerGroup.getVisibleLayers(), function(layerModel) {
        var layerConfig = {
          type: 'cartodb',
          options: {
            sql: layerModel.get('sql'),
            cartocss: layerModel.get('cartocss'),
            cartocss_version: layerModel.get('cartocss_version') || '2.1.0',
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
      config.layers = layers;

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

      return config;
    }.bind(this)
  }
}

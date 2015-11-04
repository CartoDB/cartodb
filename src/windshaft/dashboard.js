cdb.windshaft.Dashboard = function(options) {
  BOUNDING_BOX_FILTER_WAIT = 500;

  this.layerGroup = options.layerGroup;
  this.layers = new Backbone.Collection(options.layers);
  this.widgets = new Backbone.Collection(options.widgets);
  this.filters = new cdb.windshaft.filters.Collection(options.filters);
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new cdb.windshaft.DashboardInstance();

  // Bindings
  this.layerGroup.bindDashboardInstance(this.instance);
  this.layers.bind('change', this._createInstance, this);
  this.filters.bind('change', this._filterChanged, this);
  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this._createInstance();
};

cdb.windshaft.Dashboard.prototype._createInstance = function(options) {
  var options = options || {};

  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers,
    widgets: this.widgets
  });

  this.client.instantiateMap({
    mapDefinition: dashboardConfig,
    filters: this.filters.toJSON(),
    success: function(dashboardInstance) {

      // Update the dashboard instance with the attributes of the new one
      this.instance.set(dashboardInstance.toJSON());

      // TODO: Set the URL of the attributes service once it's available
      this.layerGroup.set({
        urls: dashboardInstance.getTiles()
      });

      this._updateWidgetURLs({
        layerId: options.layerId
      });
    }.bind(this),
    error: function(error) {
      console.log('Error creating dashboard instance: ' + error);
    }
  });

  return this.instance;
};

cdb.windshaft.Dashboard.prototype._filterChanged = function(filter) {
  var layerId = filter.get('layerId')
  this._createInstance({
    layerId: layerId
  });
};

cdb.windshaft.Dashboard.prototype._boundingBoxChanged = function() {
  if (this.instance) {
    this._updateWidgetURLs();
  }
};

cdb.windshaft.Dashboard.prototype._updateWidgetURLs = function(options) {
  var options = options || {};
  var self = this;
  var boundingBoxFilter = new cdb.windshaft.filters.BoundingBoxFilter(this.map.getViewBounds());
  var layerId = options.layerId;
  this.widgets.each(function(widget) {
    var silent = layerId && widget.get('layerId') !== layerId;
    var url = self.instance.getWidgetURL({
      widgetId: widget.get('id'),
      protocol: 'http'
    });

    widget.set({
      'url': url,
      'boundingBox': boundingBoxFilter.toString()
    }, {
      silent: silent
    });
  });
};


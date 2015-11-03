// TODO:
//  - Instead of using this.layers, we should only consider visible layers for LayerGroups
//  - createInstance callback
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
  this.layers.bind('change', this.createInstance, this);
  this.filters.bind('change', this.createInstance, this);
  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this.createInstance();
};

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers,
    widgets: this.widgets
  });
  console.log(dashboardConfig);

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

      this._updateWidgetURLs();
    }.bind(this),
    error: function(error) {
      console.log('Error creating dashboard instance: ' + error);
    }
  });

  return this.instance;
};

cdb.windshaft.Dashboard.prototype._boundingBoxChanged = function() {
  if (this.instance) {
    this._updateWidgetURLs();
  }
};

cdb.windshaft.Dashboard.prototype._updateWidgetURLs = function() {
  var self = this;
  var boundingBoxFilter = new cdb.windshaft.filters.BoundingBoxFilter(this.map.getViewBounds());
  this.instance.forEachWidget(function(widgetId, widgetMetadata) {
    var widgetModel = self.widgets.find({ id: widgetId });

    // TODO: Could be https
    var url = widgetMetadata.url.http;
    widgetModel.set({
      'url': url,
      'boundingBox': boundingBoxFilter.toString()
    });
  });
};


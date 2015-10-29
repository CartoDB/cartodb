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

  this.boundingBoxFilter = new cdb.windshaft.filters.BoundingBoxFilter(this.map.getViewBounds());

  // Bindings
  this.layerGroup.bindDashboardInstance(this.instance);
  this.layers.bind('change', this.createInstance, this);
  this.filters.bind('change', this.createInstance, this);

  // When the instance has changed, we need to update some models (eg: widgets) in this class
  // with the information that the instance contains.
  var self = this;
  this.instance.bind('change:layergroupid', function(dashboardInstance) {

    // TODO: Set the URL of the attributes service once it's available
    this.layerGroup.set({
      urls: dashboardInstance.getTiles()
    });

    this._updateWidgetURLs();
  }.bind(this));

  this.map.bind('change:center', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);
};

cdb.windshaft.Dashboard.prototype._boundingBoxChanged = function() {
  if (this.instance.isLoaded()) {
    this.boundingBoxFilter.setBounds(this.map.getViewBounds());

    this._updateWidgetURLs();
  }
};

cdb.windshaft.Dashboard.prototype._updateWidgetURLs = function() {
  var self = this;
  this.instance.forEachWidget(function(widgetId, widgetMetadata) {
    var widgetModel = self._getWidgetById(widgetId);

    // TODO: Could be https
    var url = widgetMetadata.url.http;
    widgetModel.set({
      'url': url,
      'boundingBox': self.boundingBoxFilter.toString()
    });
  });
};

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers,
    widgets: this.widgets
  });
  console.log(dashboardConfig);

  var instance = this.client.instantiateMap(dashboardConfig, this.filters.toJSON());
  instance.bind('change:layergroupid', function() {
    this.instance.set(instance.toJSON());
  }.bind(this));

  return this.instance;
};

cdb.windshaft.Dashboard.prototype._getWidgetById = function(widgetId) {
  return this.widgets.find({ id: widgetId });
};

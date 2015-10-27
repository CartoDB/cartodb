cdb.windshaft.Dashboard = function(options) {
  this.layers = new Backbone.Collection(options.layers);
  this.layerGroup = options.layerGroup;
  // TODO: Pass widgets in the options
  this.widgets = this.getWidgets();
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new cdb.windshaft.DashboardInstance();

  // Bindings
  this.layers.bind('change', this.createInstance, this);
  this.widgets.bind('change:filter', this.createInstance, this);

  // When the instance has changed, we need to update some models (eg: widgets) in this class
  // with the information that the instance contains.
  var self = this;
  this.instance.bind('change:layergroupid', function(dashboardInstance) {

    // Set the tiles and grid URLS on the layerGroup
    // TODO: Set the URL of the attributes service once it's available
    this.layerGroup.set({
      urls: dashboardInstance.getTiles()
    });

    // Update the URLs of the widgets
    dashboardInstance.forEachWidget(function(widgetId, widgetMetadata) {
      var widgetModel = self.getWidgetById(widgetId);

      // TODO: Could be https
      widgetModel.set('url', widgetMetadata.url.http);
    });
  }.bind(this));
};

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var dashboardConfig = this.configGenerator.generate(this);
  console.log(dashboardConfig);

  var filters = {};
  if (!this.widgets.isEmpty()) {
    filters.layers = [];

    this.widgets.each(function(widget) {
      if (widget.get('filter')) {
        var filter = {};
        filter[widget.get('id')] = widget.get('filter');
        filters.layers.push(filter);
      }
    });
  }

  var instance = this.client.instantiateMap(dashboardConfig, filters);
  instance.bind('change:layergroupid', function() {
    this.instance.set(instance.toJSON());
  }.bind(this));

  return this.instance;
};

cdb.windshaft.Dashboard.prototype.getLayers = function() {
  return this.layers;
};

cdb.windshaft.Dashboard.prototype.getVisibleLayers = function() {
  return this.layers.filter(function(layer) { return layer.isVisible(); });
};

cdb.windshaft.Dashboard.prototype.getWidgetById = function(widgetId) {
  return this.getWidgets().find({ id: widgetId });
};

cdb.windshaft.Dashboard.prototype.getWidgets = function() {
  if (!this.widgets) {
    this.widgets = new Backbone.Collection();
    this.layers.each(function(layer) {
      _.each(layer.widgets, function(widget) {
        this.widgets.add(widget);
      }.bind(this));
    }.bind(this));
  }

  return this.widgets;
}

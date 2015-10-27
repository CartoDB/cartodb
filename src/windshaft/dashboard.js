cdb.windshaft.Dashboard = function(options) {
  this.layers = new Backbone.Collection(options.layers);
  this.layerGroup = options.layerGroup;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new cdb.windshaft.DashboardInstance();
  this.layers.bind('change', this.createInstance, this);

  // When the instance has changed, we need to update some models (eg: widgets) in this class
  // with the information that the instance contains.
  var self = this;
  this.instance.bind('change:layergroupid', function(dashboardInstance) {

    // Set the tiles and grid URLS on the layerGroup
    this.layerGroup.set({
      urls: dashboardInstance.getTiles()
    });

    // Update the URLs of the
    dashboardInstance.forEachWidget(function(widgetId, widgetMetadata) {
      var widgetModel = self.getWidgetByName(widgetId);

      // TODO: Could be https
      widgetModel.set('url', widgetMetadata.url.http);
    });
  }.bind(this));
};

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var dashboardConfig = this.configGenerator.generate(this);
  console.log(dashboardConfig);
  var instance = this.client.instantiateMap(dashboardConfig);
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

cdb.windshaft.Dashboard.prototype.getWidgetByName = function(name) {

  // TODO: Pass the widgets as options instead of traversing the layers
  if (!this.widgetsByName) {
    this.widgetsByName = {};
    this.layers.each(function(layer) {
      _.each(layer.widgets, function(widget) {
        this.widgetsByName[widget.get('id')] = widget;
      }.bind(this));
    }.bind(this));

    console.log(this.widgetsByName);
  }

  return this.widgetsByName[name];
};

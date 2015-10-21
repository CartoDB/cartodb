cdb.windshaft.Dashboard = function(options) {
  this.cartoDBLayerGroup = options.cartoDBLayerGroup;
  this.widgets = options.widgets;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new cdb.windshaft.DashboardInstance();
  this.cartoDBLayerGroup.bindDashboardInstance(this.instance);

  // Bindings
  this.cartoDBLayerGroup.layers.bind('change', this.createInstance, this);
  this.instance.bind('change:layergroupid', this._updateWidgets, this);
};

cdb.windshaft.Dashboard.prototype._updateWidgets = function(dashboardInstance) {
  _.each(this.widgets, function(widget) {
    widget.set({
      dashboardBaseURL: dashboardInstance.getBaseURL(),
    });
  }.bind(this));
};

cdb.windshaft.Dashboard.prototype.createInstance = function() {
  var dashboardConfig = this.configGenerator.generate(this);
  var instance = this.client.instantiateMap(dashboardConfig);
  instance.bind('change:layergroupid', function() {
    this.instance.set(instance.toJSON());
  }.bind(this));

  return this.instance;
};

cdb.windshaft.Dashboard.prototype.getLayers = function() {
  return this.cartoDBLayerGroup.layers;
};

cdb.windshaft.Dashboard.prototype.getVisibleLayers = function() {
  return this.cartoDBLayerGroup.getVisibleLayers();
};

cdb.windshaft.Dashboard.prototype.getWidgets = function() {
  return this.widgets;
};





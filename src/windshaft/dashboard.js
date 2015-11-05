var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftFiltersBoundingBoxFilter = require('./filters/bounding_box');
var WindshaftDashboardInstance = require('./dashboard_instance');

var WindshaftDashboard = function(options) {
  BOUNDING_BOX_FILTER_WAIT = 500;

  this.layerGroup = options.layerGroup;
  this.layers = new Backbone.Collection(options.layers);
  this.widgets = new Backbone.Collection(options.widgets);
  this.filters = new WindshaftFiltersCollection(options.filters);
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new WindshaftDashboardInstance();

  // Bindings
  this.layerGroup.bindDashboardInstance(this.instance);
  this.layers.bind('change', this._createInstance, this);
  this.filters.bind('change', this._filterChanged, this);
  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this._createInstance();
};

WindshaftDashboard.prototype._createInstance = function(options) {
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

WindshaftDashboard.prototype._filterChanged = function(filter) {
  var layerId = filter.get('layerId')
  this._createInstance({
    layerId: layerId
  });
};

WindshaftDashboard.prototype._boundingBoxChanged = function() {
  if (this.instance) {
    this._updateWidgetURLs();
  }
};

WindshaftDashboard.prototype._updateWidgetURLs = function(options) {
  var options = options || {};
  var self = this;
  var boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this.map.getViewBounds());
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

module.exports = WindshaftDashboard;

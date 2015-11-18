var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftFiltersBoundingBoxFilter = require('./filters/bounding_box');
var WindshaftDashboardInstance = require('./dashboard_instance');

var WindshaftDashboard = function(options) {
  BOUNDING_BOX_FILTER_WAIT = 500;

  this.layerGroup = options.layerGroup;
  this.layers = new Backbone.Collection(options.layers);
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new WindshaftDashboardInstance();

  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this.layers.bind('change', this._layerChanged, this);
  this.layers.bind('change:filter', this._layerChanged, this);

  this._createInstance();
};

WindshaftDashboard.prototype._createInstance = function(options) {
  var options = options || {};

  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers.models
  });

  var visibleLayers = this.layers.filter(function(layer) { return layer.isVisible(); });
  var filtersFromVisibleLayers = _.chain(this.layers.models)
    .filter(function(layer) { return layer.isVisible(); })
    .map(function(layer) { return layer.getFilters(); })
    .flatten()
    .value();

  var filters = new WindshaftFiltersCollection(filtersFromVisibleLayers);

  this.client.instantiateMap({
    mapDefinition: dashboardConfig,
    filters: filters.toJSON(),
    success: function(dashboardInstance) {

      // Update the dashboard instance with the attributes of the new one
      this.instance.set(dashboardInstance.toJSON());

      // TODO: Set the URL of the attributes service once it's available
      this.layerGroup && this.layerGroup.set({
        baseURL: dashboardInstance.getBaseURL(),
        urls: dashboardInstance.getTiles('mapnik')
      });

      this._updateWidgetURLs({
        layerId: options.layerId
      });

      // update other kind of layers too
      this.layers.each(function(layer) {
        if (layer.get('type') === 'torque') {
          console.log(dashboardInstance.getTiles('torque'));
          layer.set('urls', dashboardInstance.getTiles('torque'));
        }
      });

    }.bind(this),
    error: function(error) {
      console.log('Error creating dashboard instance: ' + error);
    }
  });

  return this.instance;
};

WindshaftDashboard.prototype._boundingBoxChanged = function() {
  if (this.instance.isLoaded()) {
    this._updateWidgetURLs();
  }
};

WindshaftDashboard.prototype._updateWidgetURLs = function(options) {
  var options = options || {};
  var self = this;
  var boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this.map.getViewBounds());
  var layerId = options.layerId;

  this.layers.each(function(layer) {
    layer.widgets.each(function(widget) {
      var silent = layerId && layer.get('id') !== layerId;
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
  });
};

WindshaftDashboard.prototype._layerChanged = function(layer) {
  var layerId = layer.get('id');
  this._createInstance({
    layerId: layerId
  });
};

module.exports = WindshaftDashboard;

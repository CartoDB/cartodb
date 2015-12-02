var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftFiltersBoundingBoxFilter = require('./filters/bounding_box');
var WindshaftDashboardInstance = require('./dashboard-instance');

var WindshaftDashboard = function(options) {
  BOUNDING_BOX_FILTER_WAIT = 500;

  this.layerGroup = options.layerGroup;
  this.layers = new Backbone.Collection(options.layers);
  this.widgets = options.widgets;
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new WindshaftDashboardInstance();

  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this.layers.bind('change', this._layerChanged, this);
  this.widgets.bind('change:filter', this._filterChanged, this);

  this._createInstance();
};

WindshaftDashboard.prototype._createInstance = function(options) {
  var options = options || {};

  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers.models,
    widgets: this.widgets
  });


  var filtersFromVisibleLayers = this.widgets.chain()
    .filter(function(w) { return w.layer.isVisible() })
    .map(function(w) { return w.filter })
    .compact() // not all widgets have filters
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

      // update other kind of layers too
      this.layers.each(function(layer, layerIndex) {
        layer.set('meta', dashboardInstance.getLayerMeta(layerIndex));
        if (layer.get('type') === 'torque') {
          layer.set('urls', dashboardInstance.getTiles('torque'));
        }
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

WindshaftDashboard.prototype._boundingBoxChanged = function() {
  if (this.instance.isLoaded()) {
    this._updateWidgetURLs();
  }
};

WindshaftDashboard.prototype._updateWidgetURLs = function(options) {
  options = options || {};
  var boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this.map.getViewBounds());
  var boundingBox = boundingBoxFilter.toString();
  var layerId = options.layerId;

  this.widgets.each(function(widget) {
    var url = this.instance.getWidgetURL({
      widgetId: widget.get('id'),
      protocol: 'http'
    });

    var layerMeta = widget.layer.get('meta') || {};
    var extraAttrs = {};
    if (layerMeta.steps && layerMeta.column_type && _.isNumber(layerMeta.start) && _.isNumber(layerMeta.end)) {
      extraAttrs = {
        bins: layerMeta.steps,
        columnType: layerMeta.column_type,
        start: layerMeta.start  / 1000,
        end:  layerMeta.end / 1000
      };
    }

    widget.set(_.extend({
      'url': url,
      'boundingBox': boundingBox
    }, extraAttrs), {
      silent: layerId && layerId !== widget.layer.get('id')
    });
  }, this);
};

WindshaftDashboard.prototype._filterChanged = function(w) {
  this._createInstance({
    layerId: w.layer.get('id')
  });
};

WindshaftDashboard.prototype._layerChanged = function(layer) {
  var layerId = layer.get('id');
  this._createInstance({
    layerId: layerId
  });
};

module.exports = WindshaftDashboard;

var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftFiltersBoundingBoxFilter = require('./filters/bounding-box');
var WindshaftDashboardInstance = require('./dashboard-instance');

var WindshaftDashboard = function (options) {
  var BOUNDING_BOX_FILTER_WAIT = 500;

  this.layerGroup = options.layerGroup;
  this.layers = new Backbone.Collection(options.layers);
  this.dataviews = options.dataviews;
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;

  this.instance = new WindshaftDashboardInstance();

  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);

  this.layers.bind('change', this._layerChanged, this);
  this.dataviews.bind('change:filter', this._filterChanged, this);

  this._createInstance();
};

WindshaftDashboard.prototype._createInstance = function (options) {
  options = options || {};

  var dashboardConfig = this.configGenerator.generate({
    layers: this.layers.models,
    dataviews: this.dataviews
  });

  var filtersFromVisibleLayers = this.dataviews.chain()
    .filter(function (dataview) { return dataview.layer.isVisible(); })
    .map(function (dataview) { return dataview.filter; })
    .compact() // not all dataviews have filters
    .value();

  var filters = new WindshaftFiltersCollection(filtersFromVisibleLayers);

  this.client.instantiateMap({
    mapDefinition: dashboardConfig,
    filters: filters.toJSON(),
    success: function (dashboardInstance) {
      // Update the dashboard instance with the attributes of the new one
      this.instance.set(dashboardInstance.toJSON());

      // TODO: Set the URL of the attributes service once it's available
      this.layerGroup && this.layerGroup.set({
        baseURL: dashboardInstance.getBaseURL(),
        urls: dashboardInstance.getTiles('mapnik')
      });

      // update other kind of layers too
      this.layers.each(function (layer, layerIndex) {
        if (layer.get('type') === 'torque') {
          layer.set('meta', dashboardInstance.getLayerMeta(layerIndex));
          layer.set('urls', dashboardInstance.getTiles('torque'));
        }
      });

      this._updateDataviewURLs({
        layerId: options.layerId
      });
    }.bind(this),
    error: function (error) {
      console.log('Error creating dashboard instance: ' + error);
    }
  });

  return this.instance;
};

WindshaftDashboard.prototype._boundingBoxChanged = function () {
  if (this.instance.isLoaded()) {
    this._updateDataviewURLs();
  }
};

WindshaftDashboard.prototype._updateDataviewURLs = function (options) {
  options = options || {};
  var boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this.map.getViewBounds());
  var boundingBox = boundingBoxFilter.toString();
  var layerId = options.layerId;

  this.dataviews.each(function (dataview) {
    var url = this.instance.getDataviewURL({
      dataviewId: dataview.get('id'),
      protocol: 'http'
    });

    var layerMeta = dataview.layer.get('meta') || {};
    var extraAttrs = {};
    if (layerMeta.steps && layerMeta.column_type && _.isNumber(layerMeta.start) && _.isNumber(layerMeta.end)) {
      extraAttrs = {
        bins: layerMeta.steps,
        columnType: layerMeta.column_type,
        start: layerMeta.start / 1000,
        end: layerMeta.end / 1000
      };
    }

    dataview.set(_.extend({
      'url': url,
      'boundingBox': boundingBox
    }, extraAttrs), {
      silent: layerId && layerId !== dataview.layer.get('id')
    });
  }, this);
};

WindshaftDashboard.prototype._filterChanged = function (dataview) {
  this._createInstance({
    layerId: dataview.layer.get('id')
  });
};

WindshaftDashboard.prototype._layerChanged = function (layer) {
  var layerId = layer.get('id');
  this._createInstance({
    layerId: layerId
  });
};

module.exports = WindshaftDashboard;

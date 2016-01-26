var _ = require('underscore');
var WindshaftFiltersCollection = require('./filters/collection');
var WindshaftFiltersBoundingBoxFilter = require('./filters/bounding-box');
var WindshaftMapInstance = require('./windshaft-map-instance');
var WindshaftLayerGroupConfig = require('./layergroup-config');
var WindshaftNamedMapConfig = require('./namedmap-config');

/**
 * This class represents the concept of a map in Windshaft. It holds a reference
 * to the current map instance in Windshaft and observes some objects (map, layers,
 * dataviews) that cause the instance to be re-created.
 *
 * NOTE: We couldn't use a Backbone.Model for this because this class uses a client
 * which is a bit smart about how requests to Windshaft shoud be made.
 */
var WindshaftMap = function (options) {
  var BOUNDING_BOX_FILTER_WAIT = 500;

  this._type = options.type;
  this.layers = options.layers;
  this.dataviews = options.dataviews;
  this.map = options.map;
  this.client = options.client;
  this.statTag = options.statTag;
  this.configGenerator = options.configGenerator;
  this.instance = new WindshaftMapInstance();

  this.map.bind('change:center change:zoom', _.debounce(this._boundingBoxChanged, BOUNDING_BOX_FILTER_WAIT), this);
  this.layers.bind('change', this._layerChanged, this);
  this.dataviews.bind('change:filter', this._dataviewChanged, this);
  this.dataviews.bind('add', _.debounce(this._dataviewChanged, 10), this);

  // delay initial instance creation until sure there are not any dataviews added that will re-create the instance
  // TODO tmp fix; this is far from ideal and prone to timing issues, can we do something more elegant?
  var timeout = setTimeout(function () {
    this._createInstance();
  }.bind(this), 50);
  this.dataviews.once('all', function () {
    // Dataviews incoming, skip initial instance creation
    clearTimeout(timeout);
  }, this);
};

WindshaftMap.prototype.isNamedMap = function () {
  return this.configGenerator === WindshaftNamedMapConfig;
};

WindshaftMap.prototype.isAnonymousMap = function () {
  return this.configGenerator === WindshaftLayerGroupConfig;
};

WindshaftMap.prototype._createInstance = function (options) {
  options = options || {};

  var cfg = this.configGenerator.generate({
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
    mapDefinition: cfg,
    statTag: this.statTag,
    filters: filters.toJSON(),
    success: function (mapInstance) {
      // Update the map instance with the attributes of the newly created one
      this.instance.set(mapInstance.toJSON());

      // update other kind of layers too
      this.layers.each(function (layer, layerIndex) {
        if (layer.get('type') === 'torque') {
          layer.set('meta', mapInstance.getLayerMeta(layerIndex));
          layer.set('urls', mapInstance.getTiles('torque'));
        }
      });

      this._updateDataviewURLs({
        layerId: options.layerId
      });
    }.bind(this),
    error: function (error) {
      console.log('Error creating the map instance on Windshaft: ' + error);
    }
  });

  return this.instance;
};

WindshaftMap.prototype._boundingBoxChanged = function () {
  if (this.instance.isLoaded()) {
    this._updateDataviewURLs();
  }
};

WindshaftMap.prototype._updateDataviewURLs = function (options) {
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

WindshaftMap.prototype._dataviewChanged = function (dataview) {
  this._createInstance({
    layerId: dataview.layer.get('id')
  });
};

WindshaftMap.prototype._layerChanged = function (layer) {
  if (layer.needsUpdate())
    this._createInstance({
      layerId: layer.get('id')
    });
  }
};

module.exports = WindshaftMap;

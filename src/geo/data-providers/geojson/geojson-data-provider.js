var _ = require('underscore');
var Backbone = require('backbone');
var CategoryFilter = require('../../../windshaft/filters/category');
var RangeFilter = require('../../../windshaft/filters/range');

var GeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  this._vectorLayerView = vectorLayerView;
  this._layerIndex = layerIndex;

  vectorLayerView._on('featuresChanged', function (features) {
    this.trigger('featuresChanged', features[this._layerIndex]);
  }.bind(this));
};

// TODO: We can extract each "generator" to an individual file so that this file doesn't get too BIG
GeoJSONDataProvider.prototype._dataGeneratorsForDataviews = {,
  histogram: function (features, options) {
    var filter = this._vectorLayerView.renderers[this._layerIndex].filter;
    var columnName = options.column;
    var end = typeof options.end !== 'undefined' ? options.end : filter.getMin;
    var start = typeof options.start !== 'undefined' ? options.start : filter.getMax;
    var width = (end - start) / options.bins;
    filter.createDimension(columnName)
    var hist = filter.dimensions[columnName].group(function (f) { return Math.floor(f / width) }).top(Infinity)

    var bins = hist.map(function (bin, index) {
      return {
        bin: index,
        max: 0,
        min: 0,
        avg: 0,
        freq: bin.value
      }
    })
    var histogram = {"bin_width": width,"bins_count":bins.length, "bins_start": start,"nulls":0,"avg":67.24617244157938,"bins": bins,"type":"histogram"}
    return histogram;
  },
  category: function (features, options) {
    var filter = this._vectorLayerView.renderers[this._layerIndex].filter;
    var columnName = options.column;
    var numberOfCategories = 5;
    var sortedGroups = filter.getColumnValues(columnName);
    var lastCat = {
      category: 'Other',
      value: sortedGroups.slice(numberOfCategories).reduce(function (p, c) {
        return p + c.value;
      }, 0),
      agg: true
    };

    // TODO: Calculate harcoded values
    var data = {
      categories: [],
      categoriesCount: sortedGroups.length,
      count: filter.getCount(columnName),
      max: sortedGroups[0].value,
      min: sortedGroups[sortedGroups.length - 1].value,
      nulls: 0,
      type: 'aggregation'
    };

    _.each(sortedGroups.slice(0, numberOfCategories), function (category) {
      data.categories.push({
        category: category.key,
        value: category.value,
        agg: false
      });
    });
    data.categories.push(lastCat);
    return data;
  },

  formula: function (features, options) {
    var operation = options.operation;
    var columnName = options.column;
    var data;
    if (operation === 'count') {
      data = {
        'operation': 'count',
        'result': features.length,
        'nulls': 0,
        'type': 'formula'
      };
    } else if (operation === 'avg') {
      var total = 0;
      _.each(features, function (feature) {
        total += parseInt(feature.properties[columnName], 10);
      });
      data = {
        'operation': 'avg',
        'result': +(total / features.length).toFixed(2),
        'nulls': 0,
        'type': 'formula'
      };
    } else {
      throw new Error("Coudn't generate data for formula dataview and '" + operation + "' operation.");
    }
    return data;
  }
};

GeoJSONDataProvider.prototype.generateDataForDataview = function (dataview, features) {
  var generateData = this._dataGeneratorsForDataviews[dataview.get('type')].bind(this);
  if (!generateData) {
    throw new Error("Couldn't generate data for dataview of type: " + dataview.get('type'));
  }

  var data = generateData(features, dataview.attributes);
  return data;
};

GeoJSONDataProvider.prototype.applyFilter = function (columnName, filter) {
  var filterType;
  var filterOptions;
  if (filter instanceof CategoryFilter) {
    if (filter.isEmpty()) {
      filterType = 'accept';
      filterOptions = { column: columnName, values: 'all' };
    } else if (filter.get('rejectAll')) {
      filterType = 'reject';
      filterOptions = { column: columnName, values: 'all' };
    } else if (filter.acceptedCategories.size()) {
      filterType = 'accept';
      filterOptions = { column: columnName, values: filter.getAcceptedCategoryNames() };
    } else if (filter.rejectedCategories.size()) {
      filterType = 'reject';
      filterOptions = { column: columnName, values: filter.getRejectedCategoryNames() };
    }
  } else if (filter instanceof RangeFilter) {
    filterType = 'range';
    if (filter.isEmpty()) {
      filterOptions = { column: columnName, min: 0, max: Infinity };
    } else {
      filterOptions = { column: columnName, min: filter.get('min'), max: filter.get('max') };
    }
  } else {
    throw new Error('Filter on ' + columnName + " couldn't be applied. Filter type wasn't recognized.");
  }

  this._vectorLayerView.applyFilter(this._layerIndex, filterType, filterOptions);
};

_.extend(GeoJSONDataProvider.prototype, Backbone.Events);

module.exports = GeoJSONDataProvider;

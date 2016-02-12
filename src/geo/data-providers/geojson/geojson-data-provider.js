var _ = require('underscore');
var Backbone = require('backbone');
var d3 = require('d3');
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
GeoJSONDataProvider.prototype._dataGeneratorsForDataviews = {
  histogram: function (features, options) {
    var filter = this._vectorLayerView.getFilter(this._layerIndex);
    var columnName = options.column;
    var end, start, bins, width, values;
    var numberOfBins = options.bins || options.data.length;
    if (options.own_filter === 1) {
      end = filter.getMax(columnName);
      start = filter.getMin(columnName);
      values = filter.getValues()
      bins = d3.layout.histogram().bins(numberOfBins)(filter.getValues().map(function (f) {
        return f.properties[options.column];
      }));
      width = (end - start) / options.data.length;
    } else {
      end = options.end || filter.getMax(columnName);
      start = options.start > -1 ? options.start : filter.getMin(columnName);
      width = (end - start) / options.bins;
      values = filter.getValues(false, columnName)
      bins = d3.layout.histogram().bins(numberOfBins)(filter.getValues(false, columnName).map(function (f) {
        return f.properties[options.column];
      }));
    }
    bins = bins.map(function (bin, index) {
      return {
        bin: index,
        max: d3.max(bin),
        min: d3.min(bin),
        avg: d3.mean(bin),
        freq: bin.length
      };
    });
    var nulls = values.reduce(function(p, c) { return p + (c.properties[columnName] === null ? 1 : 0) }, 0);
    var average = bins.reduce(function (p, c) {
      return p + c.avg;
    }, 0) / bins.reduce(function (p, c) {
      return p + c.freq;
    }, 0);
    var histogram = {
      'bin_width': width,
      'bins_count': bins.length,
      'bins_start': start,
      'nulls': nulls,
      'avg': average,
      'bins': bins,
      'type': 'histogram'
    };
    return histogram;
  },
  category: function (features, options) {
    var columnName = options.column;
    var filterEnabled = options.filterEnabled;
    var numberOfCategories = 5;

    var sortedGroups;
    var count;
    if (filterEnabled) {
      // TODO: There's probably a more efficient way of doing this
      var groups = _.groupBy(features, function (feature) { return feature.properties[columnName]; });
      var groupCounts = _.map(Object.keys(groups), function (key) {
        return {
          key: key,
          value: groups[key].length
        };
      });
      sortedGroups = _.sortBy(groupCounts, function (group) {
        return group.value;
      }).reverse();
      count = features.length;
    } else {
      var filter = this._vectorLayerView.getFilter(this._layerIndex);
      sortedGroups = filter.getColumnValues(columnName);
      count = filter.getCount(columnName);
    }
    var nulls = filter.getValues(false, columnName).reduce(function(p, c) { return p + (c.properties[columnName] === null ? 1 : 0) }, 0);
    var data = {
      categories: [],
      categoriesCount: sortedGroups.length,
      count: count,
      max: sortedGroups[0].value,
      min: sortedGroups[sortedGroups.length - 1].value,
      nulls: nulls,
      type: 'aggregation'
    };

    _.each(sortedGroups.slice(0, numberOfCategories), function (category) {
      data.categories.push({
        category: category.key,
        value: category.value,
        agg: false
      });
    });

    if (!filterEnabled) {
      var lastCat = {
        category: 'Other',
        value: sortedGroups.slice(numberOfCategories).reduce(function (p, c) {
          return p + c.value;
        }, 0),
        agg: true
      };
      data.categories.push(lastCat);
    }
    return data;
  },

  formula: function (features, options) {
    var operation = options.operation;
    var columnName = options.column;
    var data;
    var nulls = features.reduce(function(p, c) { return p + (c.properties[columnName] === null ? 1 : 0) }, 0);
    if (operation === 'count') {
      data = {
        'operation': 'count',
        'result': features.length,
        'nulls': nulls,
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
        'nulls': nulls,
        'type': 'formula'
      };
    } else if (operation === 'sum') {
      data = {
        'operation': 'sum',
        'result': features.reduce(function(p,c){return p+c.properties[columnName]},0),
        'nulls': nulls,
        'type': 'formula'
      }
    } else if (operation === 'min') {
      data = {
        'operation': 'min',
        'result': features.reduce(function(p,c){return Math.min(p,c.properties[columnName])}, Infinity),
        'nulls': nulls,
        'type': 'formula'
      }
    } else if (operation === 'min') {
      data = {
        'operation': 'max',
        'result': features.reduce(function(p,c){return Math.max(p,c.properties[columnName])}, 0),
        'nulls': nulls,
        'type': 'formula'
      }
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

  // TODO: Each generator needs different options show we should be more
  // explicit instead of passing dataview.attributes through.
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

GeoJSONDataProvider.prototype.getData = function () {
  return this._vectorLayerView.getFeatures()[this._layerIndex];
};

_.extend(GeoJSONDataProvider.prototype, Backbone.Events);

module.exports = GeoJSONDataProvider;

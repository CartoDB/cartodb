var _ = require('underscore');
var GeoJSONDataProviderBase = require('./geojson-data-provider-base');

var CategoryGeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  GeoJSONDataProviderBase.apply(this, arguments);
};

_.extend(CategoryGeoJSONDataProvider.prototype, GeoJSONDataProviderBase.prototype);

CategoryGeoJSONDataProvider.prototype.getData = function () {
  var options = this._dataview.attributes;
  var columnName = options.column;
  var filterEnabled = options.filterEnabled;
  var numberOfCategories = 5;
  var filter = this._vectorLayerView.getFilter(this._layerIndex);
  var features;
  if (!filterEnabled) {
    features = filter.getValues(false, columnName);
  } else {
    features = filter.getValues();
  }

  // TODO: There's probably a more efficient way of doing this
  var groups = _.groupBy(features, function (feature) { return feature.properties[columnName]; });
  var groupCounts = _.map(Object.keys(groups), function (key) {
    return {
      key: key,
      value: groups[key].length
    };
  });
  var sortedGroups = _.sortBy(groupCounts, function (group) {
    return group.value;
  }).reverse();
  var count = features.length;

  var nulls = features.reduce(function (p, c) { return p + (c.properties[columnName] === null ? 1 : 0); }, 0);
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
  var remainingCategories = sortedGroups.slice(numberOfCategories);
  if (!filterEnabled && remainingCategories.length > 0) {
    var lastCat = {
      category: 'Other',
      value: remainingCategories.reduce(function (p, c) {
        return p + c.value;
      }, 0),
      agg: true
    };
    data.categories.push(lastCat);
  }
  return data;
};

CategoryGeoJSONDataProvider.prototype.applyFilter = function (filter) {
  var columnName = this._dataview.get('column');
  var filterType;
  var filterOptions;
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
  this._vectorLayerView.applyFilter(this._layerIndex, filterType, filterOptions);
};

module.exports = CategoryGeoJSONDataProvider;

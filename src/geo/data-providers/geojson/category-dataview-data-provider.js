var _ = require('underscore');
var DataviewDataProviderBase = require('./dataview-data-provider-base');

var CategoryDataviewDataProvider = function (vectorLayerView, layerIndex) {
  DataviewDataProviderBase.apply(this, arguments);
};

_.extend(CategoryDataviewDataProvider.prototype, DataviewDataProviderBase.prototype);

CategoryDataviewDataProvider.prototype.getData = function () {
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

  var data = {
    categories: [],
    categoriesCount: 0,
    count: 0,
    max: 0,
    min: 0,
    nulls: 0,
    type: 'aggregation'
  };

  if (!features.length) return data;

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

  data.count = features.length;
  data.categoriesCount = sortedGroups.length;
  data.max = sortedGroups[0].value;
  data.min = sortedGroups[sortedGroups.length - 1].value;
  data.nulls = filter.getValues(false, columnName).reduce(function (p, c) { return p + (c.properties[columnName] === null ? 1 : 0); }, 0);

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

CategoryDataviewDataProvider.prototype.applyFilter = function (filter) {
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

module.exports = CategoryDataviewDataProvider;

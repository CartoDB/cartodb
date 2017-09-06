var _ = require('underscore');

var PROPERTY_KEY = 'prop';
var MAPPING_KEY = 'mapping';

var RANGE_FILTER_TYPE = 'range';
var CATEGORY_FILTER_TYPE = 'category';
var DEFAULT_FILTER_TYPE = 'default';

var Rule = function (rule) {
  this._rule = rule;
};

Rule.prototype.matchesAnyProperty = function (props) {
  return this._matches(this._rule[PROPERTY_KEY], props);
};

Rule.prototype.matchesAnyMapping = function (mappings) {
  return this._matches(this._rule[MAPPING_KEY], mappings);
};

Rule.prototype._matches = function (value, acceptedValues) {
  if (_.isString(acceptedValues)) {
    acceptedValues = [ acceptedValues ];
  }
  return _.contains(acceptedValues, value);
};

Rule.prototype.getBucketsWithRangeFilter = function () {
  return this._getBucketsByFilterType(RANGE_FILTER_TYPE);
};

Rule.prototype.getBucketsWithCategoryFilter = function () {
  return this._getBucketsByFilterType(CATEGORY_FILTER_TYPE);
};

Rule.prototype.getBucketsWithDefaultFilter = function () {
  return this._getBucketsByFilterType(DEFAULT_FILTER_TYPE);
};

Rule.prototype._getBucketsByFilterType = function (filterType) {
  if (this._rule) {
    return _.select(this._rule.buckets, function (bucket) {
      return bucket.filter.type === filterType;
    });
  }
  return [];
};

Rule.prototype.getFilterAvg = function () {
  return this._rule.stats.filter_avg;
};

module.exports = Rule;

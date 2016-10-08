var _ = require('underscore');
var Rule = require('./rule');

var VALID_PROPS = ['line-color', 'marker-fill', 'polygon-fill'];
var VALID_MAPPINGS = ['='];

var generateCategories = function (buckets) {
  return _.map(buckets, function (bucket) {
    return { label: bucket.filter.name, value: bucket.value };
  });
};

module.exports = {
  canAdapt: function (rule) {
    rule = new Rule(rule);
    return rule.matchesAnyProperty(VALID_PROPS) &&
      rule.matchesAnyMapping(VALID_MAPPINGS) &&
      rule.validatesCategoryFilter();
  },

  adapt: function (rule) {
    rule = new Rule(rule);

    var categoryFilteredBuckets = rule.getBucketsWithCategoryFilter();
    var unfilteredBuckets = rule.getBucketsWithDefaultFilter();

    return {
      categories: generateCategories(categoryFilteredBuckets),
      defaultValue: _.isEmpty(unfilteredBuckets) ? undefined : unfilteredBuckets[0].value
    };
  }
};

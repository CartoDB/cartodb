var _ = require('underscore');
var Rule = require('./rule');

var VALID_PROPS = ['marker-width', 'line-width'];

var isEveryBucketValid = function (rule) {
  var buckets = rule.getBucketsWithRangeFilter();
  return _.every(buckets, function (bucket) {
    return bucket.filter.start != null && bucket.filter.end != null;
  });
};

var calculateValues = function (buckets) {
  var lastBucket = _.last(buckets);
  return _.chain(buckets)
    .map('filter')
    .map('start')
    .concat(lastBucket.filter.end)
    .value();
};

module.exports = {
  canAdapt: function (rule) {
    rule = new Rule(rule);
    return rule.matchesAnyProperty(VALID_PROPS) && isEveryBucketValid(rule);
  },

  adapt: function (rules) {
    var rule = new Rule(rules[0]);
    var buckets = rule.getBucketsWithRangeFilter();

    return {
      values: calculateValues(buckets),
      sizes: _.map(buckets, 'value'),
      avg: rule.getFilterAvg()
    };
  }
};

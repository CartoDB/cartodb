var _ = require('underscore');
var Rule = require('./rule');

var VALID_PROPS = ['line-color', 'marker-fill', 'polygon-fill'];
var VALID_MAPPINGS = ['>', '>=', '<', '<='];

var isEveryBucketValid = function (rule) {
  var buckets = rule.getBucketsWithRangeFilter();
  return _.every(buckets, function (bucket) {
    return bucket.filter.start != null && bucket.filter.end != null;
  });
};

var generateColors = function (buckets) {
  return _.map(buckets, function (bucket, i) {
    var label = '';
    if (i === 0) {
      label = bucket.filter.start;
    } else if (i === buckets.length - 1) {
      label = bucket.filter.end;
    }
    return { value: bucket.value, label: label.toString() };
  });
};

module.exports = {
  canAdapt: function (rule) {
    rule = new Rule(rule);
    return rule.matchesAnyProperty(VALID_PROPS) &&
      rule.matchesAnyMapping(VALID_MAPPINGS) &&
      isEveryBucketValid(rule);
  },

  adapt: function (rules) {
    var rule = new Rule(rules[0]);

    var rangeBuckets = rule.getBucketsWithRangeFilter();
    var lastBucket = _.last(rangeBuckets);
    var firstBucket = _.first(rangeBuckets);

    return {
      colors: generateColors(rangeBuckets),
      avg: rule.getFilterAvg(),
      max: lastBucket.filter.end,
      min: firstBucket.filter.start
    };
  }
};

var _ = require('underscore');
var Rule = require('./rule');

var VALID_PROPS = ['marker-width'];

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
    return rule.matchesAnyProperty(VALID_PROPS) &&
      rule.validatesRangeFilter();
  },

  adapt: function (rule) {
    rule = new Rule(rule);
    var buckets = rule.getBucketsWithRangeFilter();

    return {
      values: calculateValues(buckets),
      sizes: _.map(buckets, 'value'),
      avg: rule.getFilterAvg()
    };
  }
};

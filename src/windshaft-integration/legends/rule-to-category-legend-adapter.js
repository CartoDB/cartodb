var _ = require('underscore');
var Rule = require('./rule');

var VALID_PROPS = ['line-color', 'marker-fill', 'polygon-fill', 'marker-file'];
var VALID_MAPPINGS = ['='];

var isEveryBucketValid = function (rule) {
  var buckets = rule.getBucketsWithCategoryFilter();
  return _.every(buckets, function (bucket) {
    return bucket.filter.name != null && bucket.value != null;
  });
};

var generateCategories = function (bucketsColor, bucketsIcon) {
  return _.map(bucketsColor, function (bucketColor) {
    var bucketIcon = _.find(bucketsIcon, function (bucket) {
      return bucket.filter.name === bucketColor.filter.name;
    });
    return {
      title: bucketColor.filter.name,
      icon: bucketIcon ? _extractURL(bucketIcon.value) : '',
      color: bucketColor.value
    };
  });
};

var _extractURL = function (str) {
  var url = '';
  var pattern = /(http|https):\/\/\S+\.(?:gif|jpeg|jpg|png|webp|svg)/g;
  var match = str.match(pattern);
  if (match) {
    url = match[0];
  }
  return url;
};

module.exports = {
  canAdapt: function (rule) {
    rule = new Rule(rule);
    return rule.matchesAnyProperty(VALID_PROPS) &&
      rule.matchesAnyMapping(VALID_MAPPINGS) &&
      isEveryBucketValid(rule);
  },

  adapt: function (rules) {
    var ruleColor = new Rule(rules[0]);
    var ruleIcon = new Rule(rules[1]);

    var categoryFilteredBucketsColor = ruleColor.getBucketsWithCategoryFilter();
    var categoryFilteredBucketsIcon = ruleIcon.getBucketsWithCategoryFilter();
    var unfilteredBuckets = ruleColor.getBucketsWithDefaultFilter();

    return {
      categories: generateCategories(categoryFilteredBucketsColor, categoryFilteredBucketsIcon),
      defaultColor: _.isEmpty(unfilteredBuckets) ? undefined : unfilteredBuckets[0].value
    };
  }
};

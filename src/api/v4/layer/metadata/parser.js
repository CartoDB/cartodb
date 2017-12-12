var BucketsMetadata = require('./buckets');
var CategoriesMetadata = require('./categories');
var Rule = require('../../../../windshaft-integration/legends/rule.js');

/**
 * Generates a list of Metadata objects from the original cartocss_meta rules
 *
 * @param  {Rules} rulesData
 * @return {metadata.Base[]}
 */
function getMetadataFromRules (rulesData) {
  var metadata = [];

  rulesData.forEach(function (ruleData) {
    var rule = new Rule(ruleData);

    if (_isBucketsMetadata(rule)) {
      metadata.push(new BucketsMetadata(rule));
    } else if (_isCategoriesMetadata(rule)) {
      metadata.push(new CategoriesMetadata(rule));
    }
  });

  return metadata;
}

function _isBucketsMetadata (rule) {
  return rule.getBucketsWithRangeFilter().length > 0;
}

function _isCategoriesMetadata (rule) {
  return rule.getBucketsWithCategoryFilter().length > 0;
}

module.exports = {
  getMetadataFromRules: getMetadataFromRules
};

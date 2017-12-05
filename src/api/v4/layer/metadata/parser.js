var CategoriesMetadata = require('./categories');
var GradientMetadata = require('./gradient');
var Rule = require('../../../../windshaft-integration/legends/rule.js');

module.exports = {
  /**
   * Generates a list of Metadata objects from the original cartocss_meta rules
   *
   * @param  {Rules} rulesData
   * @return {metadata.Base[]}
   */
  getMetadataFromRules: function (rulesData) {
    var metadata = [];

    rulesData.forEach(function (ruleData) {
      var rule = new Rule(ruleData);

      if (isCategoriesMetadata(rule)) {
        metadata.push(new CategoriesMetadata(rule));
      } else if (isGradientMetadata(rule)) {
        metadata.push(new GradientMetadata(rule));
      }
    });

    return metadata;
  }
};

function isCategoriesMetadata (rule) {
  return rule.getBucketsWithCategoryFilter().length > 0;
}

function isGradientMetadata (rule) {
  return rule.getBucketsWithRangeFilter().length > 0;
}

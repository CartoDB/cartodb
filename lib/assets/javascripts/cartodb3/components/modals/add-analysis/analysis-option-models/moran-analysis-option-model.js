
var _ = require('underscore');
var AnalysisOptionModel = require('./analysis-option-model');

/**
 * Custom model for moran type, to set correct
 */
module.exports = AnalysisOptionModel.extend({

  /**
   * @override {AnalysisOptionModel.getNodeAttrs}
   */
  getFormAttrs: function (sourceId, simpleGeometryTypeInput) {
    if (!_.contains(this.getValidInputGeometries(), simpleGeometryTypeInput)) throw new Error('invalid geometry type ' + simpleGeometryTypeInput + ' for moran');

    var attrs = AnalysisOptionModel.prototype.getFormAttrs.apply(this, arguments);
    delete attrs.source;
    delete attrs.denominator;
    delete attrs.significance;
    delete attrs.neighbours;
    delete attrs.permutations;
    delete attrs.weight_type;

    return attrs;
  }

});

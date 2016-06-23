var AnalysisOptionModel = require('./analysis-option-model');

/**
 * Custom model for point-in-polygon type, to set correct
 */
module.exports = AnalysisOptionModel.extend({

  /**
   * @override {AnalysisOptionModel.getNodeAttrs}
   */
  getFormAttrs: function (sourceId, simpleGeometryTypeInput) {
    var attrs = AnalysisOptionModel.prototype.getFormAttrs.apply(this, arguments);
    delete attrs.weight_column;
    return attrs;
  }

});

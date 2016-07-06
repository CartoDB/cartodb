var _ = require('underscore');
var AnalysisOptionModel = require('./analysis-option-model');

/**
 * Custom model for merge type, to set correct primary source
 */
module.exports = AnalysisOptionModel.extend({

  /**
   * @override {AnalysisOptionModel.getNodeAttrs}
   */
  getFormAttrs: function (sourceId, simpleGeometryTypeInput) {
    var attrs = AnalysisOptionModel.prototype.getFormAttrs.apply(this, arguments);
    delete attrs.source;

    _.extend(attrs, {
      primary_source_name: 'left_source',
      left_source: sourceId
    });

    return attrs;
  }
});

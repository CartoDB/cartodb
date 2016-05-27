var _ = require('underscore');
var AnalysisOptionModel = require('./analysis-option-model');

/**
 * Custom model for point-in-polygon type, to set correct
 */
module.exports = AnalysisOptionModel.extend({

  /**
   * @override {AnalysisOptionModel.getNodeAttrs}
   */
  getFormAttrs: function (sourceId, simpleGeometryTypeInput) {
    if (!_.contains(this.getValidInputGeometries(), simpleGeometryTypeInput)) throw new Error('invalid geometry type ' + simpleGeometryTypeInput + ' for point-in-polygon');

    var attrs = AnalysisOptionModel.prototype.getFormAttrs.apply(this, arguments);
    delete attrs.source;

    _.extend(attrs, simpleGeometryTypeInput === 'point' // otherwise assumed to be polygons
      ? {
        primary_source_name: 'points_source',
        points_source: sourceId
      }
      : {
        primary_source_name: 'polygons_source',
        polygons_source: sourceId
      });

    return attrs;
  }

});

var AnalysisOptionModel = require('./analysis-option-model');
var camshaftReference = require('../../../../data/camshaft-reference');

/**
 * Custom model for point-in-polygon type, to set correct
 */
module.exports = AnalysisOptionModel.extend({

  /**
   * @override {AnalysisOptionModel.getNodeAttrs}
   */
  getFormAttrs: function (sourceId, simpleGeometryTypeInput) {
    var attrs = AnalysisOptionModel.prototype.getFormAttrs.apply(this, arguments);

    this._removeSourceIfThereAreMultipleSources(attrs);

    return attrs;
  },

  _removeSourceIfThereAreMultipleSources: function (attrs) {
    var nodeCount = 0;
    var params = camshaftReference.paramsForType(attrs.type);
    for (var name in params) {
      var param = params[name];
      if (param.type === 'node') {
        nodeCount++;
      }
    }

    if (nodeCount > 1) {
      delete attrs.source;
    }
  }

});

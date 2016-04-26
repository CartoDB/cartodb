var AnalysisFormTypeView = require('./analysis-form-type-view');
var ANALYSIS_TYPE_MAP = {
  buffer: {
    FormModel: require('./area-of-influence/area-of-influence-form-model'),
    template: require('./area-of-influence/area-of-influence-form-buffer.tpl')
  },
  'trade-area': {
    FormModel: require('./area-of-influence/area-of-influence-form-model'),
    template: require('./area-of-influence/area-of-influence-form-trade-area.tpl')
  },
  'point-in-polygon': {
    FormModel: require('./point-in-polygon/analysis-point-in-polygon-form-model'),
    template: require('./point-in-polygon/analysis-point-in-polygon-form.tpl')
  }
};

module.exports = {

  getFormModel: function (type) {
    if (!type) throw new Error('Analysis type is required');

    var analysisType = ANALYSIS_TYPE_MAP[type];
    if (analysisType) {
      return analysisType['FormModel'];
    } else {
      throw new Error('Analysis ' + type + ' model not available');
    }
  },

  getFormView: function (type) {
    if (!type) throw new Error('Analysis type is required');

    var analysisType = ANALYSIS_TYPE_MAP[type];
    if (analysisType) {
      return analysisType['FormView'] || AnalysisFormTypeView;
    } else {
      throw new Error('Analysis ' + type + ' form view not available');
    }
  },

  getFormTemplate: function (type) {
    if (!type) throw new Error('Analysis type is required');

    var analysisType = ANALYSIS_TYPE_MAP[type];
    if (analysisType) {
      return analysisType['template'];
    } else {
      throw new Error('Analysis ' + type + ' template not available');
    }
  }
};

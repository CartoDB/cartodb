var analysisMap = {
  buffer: {
    labelTranslationKey: 'editor.layers.analysis-form.type.buffer',
    Class: require('./buffer/analysis-buffer-form-model')
  },
  'trade-area': {
    labelTranslationKey: 'editor.layers.analysis-form.type.trade-area',
    Class: require('./trade-area/analysis-trade-area-form-model')
  }
};

module.exports = {
  createAnalysisFormModel: function (analysisNode) {
    var analysisType = analysisNode.get('type');
    var Klass = analysisMap[analysisType].Class;
    return new Klass(analysisNode.attributes);
  }
};

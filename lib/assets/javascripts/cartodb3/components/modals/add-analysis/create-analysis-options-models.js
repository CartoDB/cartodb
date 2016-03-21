var AddAnalysisOptionModel = require('./add-analysis-option-model');

module.exports = function (analysisDefinitionNodeModel) {
  var models = [];

  var areaOfInfluence = _t('components.modals.add-analysis.sub-titles.area-of-influence');

  // Trade-area
  models.push(
    new AddAnalysisOptionModel({
      title: _t('components.modals.add-analysis.options.trade-area.title'),
      desc: _t('components.modals.add-analysis.options.trade-area.desc'),
      sub_title: areaOfInfluence,
      node_attrs: {
        type: 'trade-area',
        source_id: analysisDefinitionNodeModel.id,
        kind: 'car',
        time: 300
      }
    })
  );

  return models;
};

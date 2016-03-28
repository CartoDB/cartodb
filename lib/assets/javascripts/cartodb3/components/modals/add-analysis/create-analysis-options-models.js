var _ = require('underscore');
var camshaftReference = require('../../../data/camshaft-reference');
var AddAnalysisOptionModel = require('./add-analysis-option-model');

module.exports = function (inputGeometryType, analysisDefinitionNodeModel) {
  var models = [];

  var areaOfInfluence = _t('components.modals.add-analysis.options.sub-titles.area-of-influence');
  var type;

  type = 'buffer';
  if (_.contains(camshaftReference.getValidInputGeometriesForType(type), inputGeometryType)) {
    models.push(
      new AddAnalysisOptionModel({
        title: _t('components.modals.add-analysis.options.buffer.title'),
        desc: _t('components.modals.add-analysis.options.buffer.desc'),
        sub_title: areaOfInfluence,
        node_attrs: {
          type: type,
          source_id: analysisDefinitionNodeModel.id,
          radio: 300
        }
      })
    );
  }

  type = 'trade-area';
  if (_.contains(camshaftReference.getValidInputGeometriesForType(type), inputGeometryType)) {
    models.push(
      new AddAnalysisOptionModel({
        title: _t('components.modals.add-analysis.options.trade-area.title'),
        desc: _t('components.modals.add-analysis.options.trade-area.desc'),
        sub_title: areaOfInfluence,
        node_attrs: {
          type: type,
          source_id: analysisDefinitionNodeModel.id,
          kind: 'drive',
          time: 300
        }
      })
    );
  }

  return models;
};

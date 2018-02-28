var LayerDefinitionModel = require('builder/data/layer-definition-model');
var MergeAnalysisOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/merge-analysis-option-model');

describe('builder/components/modals/add-analysis/analysis-option-models/merge-analysis-option-model', function () {
  beforeEach(function () {
    this.layerA = new LayerDefinitionModel({
      id: 'layerA',
      type: 'cartoDB',
      letter: 'a',
      source: 'a0'
    }, {
      configModel: {}
    });

    this.model = new MergeAnalysisOptionModel({
      title: 'merge',
      desc: 'An example of a generated option model'
    }, {
      nodeAttrs: {
        type: 'merge'
      }
    });
  });

  describe('.getFormAttrs', function () {
    it('should return attrs to create a form model for analysis', function () {
      expect(this.model.getFormAttrs(this.layerA)).toEqual({
        id: 'a1',
        type: 'merge',
        left_source: 'a0',
        primary_source_name: 'left_source'
      });
    });
  });
});

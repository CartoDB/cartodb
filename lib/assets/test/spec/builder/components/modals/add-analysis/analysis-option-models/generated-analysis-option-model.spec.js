var LayerDefinitionModel = require('builder/data/layer-definition-model');
var GeneratedAnalysisOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/generated-analysis-option-model');

describe('builder/components/modals/add-analysis/analysis-option-models/generated-analysis-option-model', function () {
  beforeEach(function () {
    this.layerA = new LayerDefinitionModel({
      id: 'layerA',
      type: 'cartoDB',
      letter: 'a',
      source: 'a0'
    }, {
      configModel: {}
    });
  });

  describe('when created a type with a single source', function () {
    beforeEach(function () {
      this.model = new GeneratedAnalysisOptionModel({
        title: 'filter-category',
        desc: 'An example of a generated option model'
      }, {
        nodeAttrs: {
          type: 'filter-category'
        }
      });
    });

    describe('.getFormAttrs', function () {
      it('should return attrs to create a form model for analysis', function () {
        expect(this.model.getFormAttrs(this.layerA)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category'
        });
      });
    });
  });

  describe('when created a type with multiple input sources', function () {
    beforeEach(function () {
      this.model = new GeneratedAnalysisOptionModel({
        title: 'aggregate-intersection',
        desc: 'An example of a generated option model with multiple sources'
      }, {
        nodeAttrs: {
          type: 'aggregate-intersection'
        }
      });
    });

    describe('.getFormAttrs', function () {
      it('should return attrs but w/o any source set', function () {
        expect(this.model.getFormAttrs(this.layerA)).toEqual({
          id: 'a1',
          type: 'aggregate-intersection'
        });
      });
    });
  });
});

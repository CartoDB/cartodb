var GeneratedAnalysisOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/generated-analysis-option-model');

describe('components/modals/add-analysis/analysis-option-models/analysis-option-model', function () {
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
        expect(this.model.getFormAttrs('a0', 'point')).toEqual({
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
        expect(this.model.getFormAttrs('a0', 'point')).toEqual({
          id: 'a1',
          type: 'aggregate-intersection'
        });
      });
    });
  });
});

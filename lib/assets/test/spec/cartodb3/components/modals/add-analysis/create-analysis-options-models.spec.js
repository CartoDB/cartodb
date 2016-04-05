var cdb = require('cartodb.js');
var createAnalysisOptionsModels = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/create-analysis-options-models');

describe('components/modals/add-analysis/create-analysis-options-models', function () {
  beforeEach(function () {
    this.analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM foo'
    });
  });

  describe('when given a source with polygon output', function () {
    beforeEach(function () {
      this.models = createAnalysisOptionsModels('polygon', this.analysisDefinitionNodeModel);
    });

    it('should create a list of models available models', function () {
      expect(this.models).toEqual(jasmine.any(Array));

      var m = this.models[0];
      expect(m.get('title')).toEqual(jasmine.any(String));
      expect(m.get('sub_title')).toEqual(jasmine.any(String));
      expect(m.get('desc')).toEqual(jasmine.any(String));
      expect(m.get('node_attrs')).toEqual(jasmine.any(Object));
      expect(m.get('enabled')).toBe(true);
    });
  });

  describe('when given a source with line output', function () {
    beforeEach(function () {
      this.models = createAnalysisOptionsModels('line', this.analysisDefinitionNodeModel);
    });

    it('should create a list of models available models', function () {
      expect(this.models).toEqual(jasmine.any(Array));

      var m = this.models[0];
      expect(m.get('enabled')).toBe(false);
    });
  });
});

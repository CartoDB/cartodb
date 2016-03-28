var cdb = require('cartodb.js');
var createAnalysisOptionsModels = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/create-analysis-options-models');

describe('components/modals/add-analysis/create-analysis-options-models', function () {
  describe('when given a source', function () {
    beforeEach(function () {
      var analysisDefinitionNodeModel = new cdb.core.Model({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM foo'
      });
      this.models = createAnalysisOptionsModels(analysisDefinitionNodeModel);
    });

    it('should create a list of models available models', function () {
      expect(this.models).toEqual(jasmine.any(Array));

      var m = this.models[0];
      expect(m.get('title')).toEqual(jasmine.any(String));
      expect(m.get('sub_title')).toEqual(jasmine.any(String));
      expect(m.get('desc')).toEqual(jasmine.any(String));
      expect(m.get('node_attrs')).toEqual(jasmine.any(Object));
    });
  });
});

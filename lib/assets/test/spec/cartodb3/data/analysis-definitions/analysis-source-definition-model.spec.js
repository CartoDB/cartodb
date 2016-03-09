var AnalysisSourceDefinitionModel = require('../../../../../javascripts/cartodb3/data/analysis-definitions/analysis-source-definition-model');

describe('data/analysis-definitions/analysis-source-definition-model', function () {
  beforeEach(function () {
    this.model = new AnalysisSourceDefinitionModel({
      id: 'a0',
      table_name: 'foo_bar'
    });
  });

  describe('.toJSON', function () {
    beforeEach(function () {
      this.json = this.model.toJSON();
    });

    it('should return serialized result', function () {
      expect(this.json).toEqual({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo_bar'
        }
      });
    });

    it('should use custom query by default or create query from table name', function () {
      this.model.set('query', 'SELECT name, total FROM foo_bar LIMIT 10');
      var json = this.model.toJSON();
      expect(json.params.query).toEqual('SELECT name, total FROM foo_bar LIMIT 10');
    });
  });
});

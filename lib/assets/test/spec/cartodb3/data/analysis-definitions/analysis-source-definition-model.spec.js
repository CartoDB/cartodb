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

    it('should generate a json with params', function () {
      expect(this.json).toBeDefined();
      expect(this.json.params).toBeDefined();
    });

    it('should contain id and type', function () {
      expect(this.json.id).toEqual('a0');
      expect(this.json.type).toEqual('source');
    });

    it('should use custom query by default or create query from table name', function () {
      expect(this.json.params.query).toEqual('SELECT * FROM foo_bar');

      this.model.set('query', 'SELECT name, total FROM foo_bar LIMIT 10');
      var json = this.model.toJSON();
      expect(json.params.query).toEqual('SELECT name, total FROM foo_bar LIMIT 10');
    });
  });
});

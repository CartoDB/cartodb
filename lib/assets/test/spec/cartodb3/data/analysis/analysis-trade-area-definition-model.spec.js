var AnalysisTradeAreaDefinitionModel = require('../../../../../javascripts/cartodb3/data/analysis/analysis-trade-area-definition-model');

describe('data/analysis/analysis-trade-area-definition-model', function () {
  beforeEach(function () {
    this.model = new AnalysisTradeAreaDefinitionModel({
      id: 'a0',
      params: {
        table_name: 'foo_bar'
      }
    }, {
      parse: true
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
      expect(this.json.type).toEqual('trade-area');
    });

    it('should contain custom params', function () {
      expect(this.json.params.kind).toEqual('walk');
      expect(this.json.params.time).toEqual(300);
    });

    it('should use custom query by default or create query from table name', function () {
      expect(this.json.params.query).toEqual('SELECT * FROM foo_bar');

      this.model.set('query', 'SELECT name, total FROM foo_bar LIMIT 10');
      var json = this.model.toJSON();
      expect(json.params.query).toEqual('SELECT name, total FROM foo_bar LIMIT 10');
    });
  });
});

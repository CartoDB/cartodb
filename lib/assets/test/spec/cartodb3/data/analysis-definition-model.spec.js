var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.collection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'v-123'
    });

    this.collection.add({
      id: 'xyz123',
      analysis_definition: {
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo'
        }
      }
    });
    this.model = this.collection.get('xyz123');
  });

  it('should have create the node', function () {
    expect(this.collection.getNodeModel('a0')).toBeDefined();
  });

  describe('.toJSON', function () {
    it('should return serialized model', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'xyz123',
        analysis_definition: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      });
    });
  });
});

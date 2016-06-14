var _ = require('underscore');
var Backbone = require('backbone');
var QueryColumnModel = require('../../../../javascripts/cartodb3/data/query-column-model');

describe('data/query-columns-model', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    spyOn(QueryColumnModel.prototype, 'fetch');
    this.model = new QueryColumnModel({}, {
      configModel: this.configModel,
      tableName: 'heyyy'
    });
  });

  describe('parse', function () {
    it('should parse correctly', function () {
      var dataParsed = this.model.parse({
        cartodb_type: 'string',
        name: 'hello'
      });
      expect(dataParsed.type).toBe('string');
      expect(dataParsed.name).toBe('hello');
    });
  });

  describe('url', function () {
    beforeEach(function () {
      this.configModel.set({
        base_url: ''
      });
      this.configModel.urlVersion = function () { return 'v1'; };
    });

    it('should not provide a valid url if tableName is not defined', function () {
      this.collection._tableName = '';
      expect(this.collection.url()).toBeFalsy();
      this.collection._tableName = 'heyman';
      expect(this.collection.url()).toBe('/api/v1/tables/heyman/columns');
    });
  });
});

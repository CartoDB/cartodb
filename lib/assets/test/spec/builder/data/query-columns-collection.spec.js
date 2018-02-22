var Backbone = require('backbone');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryColumnModel = require('builder/data/query-column-model');
var QueryColumnsCollection = require('builder/data/query-columns-collection');

describe('data/query-columns-collection', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });

    spyOn(QueryColumnsCollection.prototype, 'fetch');
    this.collection = new QueryColumnsCollection([], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
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
      this.collection._tableName = 'comeon';
      expect(this.collection.url()).toBe('/api/v1/tables/comeon/columns');
    });
  });

  describe('binds', function () {
    it('should fetch query schema model when new column is added', function () {
      this.querySchemaModel.set('status', 'fetched');
      spyOn(this.querySchemaModel, 'fetch');
      this.collection.add(new Backbone.Model());
      expect(this.querySchemaModel.get('status')).toBe('unfetched');
      expect(this.querySchemaModel.fetch).toHaveBeenCalled();
    });

    it('should take query-schema when status changes to fetched', function () {
      spyOn(this.collection, 'reset').and.callThrough();
      this.querySchemaModel.columnsCollection.reset([
        {
          type: 'number',
          name: 'cartodb_id'
        }, {
          type: 'number',
          name: 'a_number'
        }, {
          type: 'string',
          name: 'texttt'
        }
      ]);

      this.querySchemaModel.set('status', 'fetched');
      expect(this.collection.reset).toHaveBeenCalled();
      expect(this.collection.size()).toBe(3);
    });
  });

  describe('setTableName', function () {
    it('should not change tableName when it is renamed but it is not referenced', function () {
      this.collection.reset([{ id: 'hola' }]);
      expect(this.collection.at(0)._tableName).toBe(undefined);
      this.collection.setTableName('two');
      expect(this.collection.at(0)._tableName).toBeUndefined();
      expect(this.collection._tableName).toBeUndefined();
    });

    it('should change tableName from itself and its children when it is renamed', function () {
      this.collection.reset([{ id: 'hola' }]);
      this.collection._tableName = 'one';
      expect(this.collection.at(0)._tableName).toBe(undefined);
      this.collection.setTableName('two');
      expect(this.collection.at(0)._tableName).toBe('two');
      expect(this.collection._tableName).toBe('two');
    });
  });

  describe('addColumn', function () {
    it('should wait and not parse the new column', function () {
      var options = {};
      var attributes;
      QueryColumnModel.prototype.save = function (attrs, opts) {
        attributes = this.attributes;
        options = opts;
      };
      this.collection.addColumn();
      expect(attributes.isNew).toBeTruthy();
      expect(attributes.type).toBe('string');
      expect(attributes.name).toContain('column_');
      expect(options.wait).toBeTruthy();
      expect(options.parse).toBeFalsy();
    });
  });
});

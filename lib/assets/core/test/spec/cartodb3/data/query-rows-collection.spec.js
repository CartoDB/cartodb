var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');
var QueryRowsCollection = require('../../../../javascripts/cartodb3/data/query-rows-collection');

describe('data/query-rows-collection', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });

    spyOn(QueryRowsCollection.prototype, 'fetch').and.callThrough();
    this.collection = new QueryRowsCollection([], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
    });

    this.collection.sync = function (a, b, opts) {
      opts = opts || {};
      opts.success && opts.success();
    };
  });

  describe('._initModels', function () {
    it('should init properly', function () {
      expect(this.collection.statusModel).toBeDefined();
    });
  });

  describe('._initBinds', function () {
    it('should change status and reset data when query-schema-model query changes', function () {
      this.collection.statusModel.set('status', 'fetched');
      this.collection.reset([{ id: 'hola' }]);

      this.querySchemaModel.set('query', 'dummy query hey!');

      expect(this.collection.statusModel.get('status')).toBe('unfetched');
      expect(this.collection.size()).toBe(0);
      expect(this.collection.canFetch()).toBeFalsy();
      expect(this.collection.shouldFetch()).toBeFalsy();
    });
  });

  describe('.isEmpty', function () {
    it('should return true if is empty', function () {
      expect(this.collection.isEmpty()).toBe(true);
      this.collection.add({});
      expect(this.collection.isEmpty()).toBe(false);
    });
  });

  describe('.isFetching', function () {
    it('should change "state" when is fetched', function () {
      expect(this.collection.isFetching()).toBeFalsy();
      this.collection.sync = function () {};
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeTruthy();
    });

    it('should change "state" when fetch has finished', function () {
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeFalsy();
      expect(this.collection.isFetched()).toBeTruthy();
    });

    it('should change "state" when fetch has failed', function () {
      this.collection.sync = function (a, b, opts) {
        opts && opts.error();
      };
      this.collection.fetch();
      expect(this.collection.isFetching()).toBeFalsy();
      expect(this.collection.isFetched()).toBeFalsy();
    });
  });
});

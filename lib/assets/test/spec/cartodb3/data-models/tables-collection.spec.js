var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
var Config = require('../../../../javascripts/cartodb3/top-level-apis/config');
var TablesCollection = require('../../../../javascripts/cartodb3/data-models/tables-collection');

describe('data-models/tables-collection', function () {
  beforeEach(function () {
    cdb.config = new Config();
    this.collection = new TablesCollection([], {
      baseUrl: '/user/pepe'
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.collection.url()).toEqual('/user/pepe/api/v1/viz');
  });

  describe('.fetch', function () {
    beforeEach(function () {
      spyOn(Backbone.Collection.prototype, 'fetch');
    });

    describe('when called without any args', function () {
      beforeEach(function () {
        this.collection.fetch();
      });

      it('should be called with default options if none is provided', function () {
        expect(Backbone.Collection.prototype.fetch).toHaveBeenCalled();
        var args = Backbone.Collection.prototype.fetch.calls.argsFor(0);
        expect(args[0]).toBeDefined();
        expect(args[0].data).toEqual(jasmine.objectContaining({ type: 'table' }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ page: 1 }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ per_page: jasmine.any(Number) }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ exclude_shared: false }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ tag_name: '' }));
        expect(args[0].data).toEqual(jasmine.objectContaining({ q: '' }));
      });
    });
  });
});

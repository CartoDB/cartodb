var Backbone = require('backbone');
var PagedSearchModel = require('../../../../javascripts/cartodb/common/paged_search_model');

describe('common/paged_search_model', function() {
  describe('.setupCollection', function() {
    beforeEach(function() {
      this.collection = new Backbone.Collection();
      this.collection.url = function() {
        return '/some/path/123';
      };
      this.collection.parse = function(response) {
        return response.items;
      };
      PagedSearchModel.setupCollection(this.collection, 'total_stuff_count');
    });

    it('should attached a pagedSearch model to the collection', function() {
      expect(this.collection.params).toBeDefined();
    });

    it('should have reasonable defaults', function() {
      expect(this.collection.params.get('page')).toEqual(1);
      expect(this.collection.params.get('per_page')).toEqual(20);
    });

    it('should set custom defaults if provided', function() {
      PagedSearchModel.setupCollection(this.collection, 'total_stuff_count', {
        page: 3,
        per_page: 42
      });
      expect(this.collection.params.get('page')).toEqual(3);
      expect(this.collection.params.get('per_page')).toEqual(42);
    });

    describe('should wrap collection.parse', function() {
      beforeEach(function() {
        this.items = [{}, {}];
        this.results = this.collection.parse({
          items: this.items,
          total_entries: 42,
          total_stuff_count: 9000
        });
      });

      it('should extract total entries', function() {
        expect(this.collection.total_entries).toEqual(42);
      });

      it('should extract total count', function() {
        expect(this.collection.total_count).toEqual(9000);
      });

      it('should still execute original parse', function() {
        expect(this.results).toBe(this.items);
      });
    });

    describe('should wrap collection.url', function() {
      beforeEach(function() {
        this.url = this.collection.url();
      });

      it('should append params to the query string', function() {
        expect(this.url).toContain('?');
        expect(this.url).toMatch(/page=\d/);
        expect(this.url).toMatch(/per_page=\d+/);
      });
    });

    describe('should wrap collection.fetch', function() {
      beforeEach(function() {
        this.args = {};
        this.loadingSpy = jasmine.createSpy('loading');
        this.collection.on('loading', this.loadingSpy);
        this.jqXHR = this.collection.fetch(this.args);
      });

      it('should trigger a loading event', function() {
        expect(this.loadingSpy).toHaveBeenCalled();
      });
    });
  });
});

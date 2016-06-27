var Backbone = require('backbone-cdb-v3');
var PagedSearchModel = require('../../../../javascripts/cartodb/common/paged_search_model');

describe('common/paged_search_model', function() {
  beforeEach(function() {
    this.model = new PagedSearchModel();
  });

  it('should have some default params', function() {
    expect(this.model.get('per_page')).toMatch(/\d+/);
    expect(this.model.get('page')).toEqual(1);
  });

  describe('.fetch', function() {
    beforeEach(function() {
      this.collection = new Backbone.Collection();

      this.fetchingSpy = jasmine.createSpy('fetching');
      this.collection.on('fetching', this.fetchingSpy);

      this.jqXHR = $.Deferred();
      spyOn(this.collection, 'fetch').and.returnValue(this.jqXHR);

      this.results = this.model.fetch(this.collection);
    });

    it('should call fetch on collection', function() {
      expect(this.collection.fetch).toHaveBeenCalledWith(jasmine.any(Object));
    });

    it('should trigger a loading event on collection', function() {
      expect(this.fetchingSpy).toHaveBeenCalled();
    });

    it('should have data params set', function() {
      expect(this.collection.fetch.calls.argsFor(0)[0].data).toEqual(jasmine.any(Object));
      expect(this.collection.fetch.calls.argsFor(0)[0].data.per_page).toMatch(/\d+/);
      expect(this.collection.fetch.calls.argsFor(0)[0].data.page).toMatch(/\d+/);
    });

    it('should return a deferred object', function() {
      expect(this.results).toBe(this.jqXHR);
    });
  });
});

var Backbone = require('backbone');
var PaginationSearchModel = require('builder/components/pagination-search/pagination-search-model');

describe('components/pagination-search/pagination-search-model', function () {
  var onFetching = jasmine.createSpy('onFetching');
  var onFetched = jasmine.createSpy('onFetched');

  beforeEach(function () {
    this.collection = new Backbone.Collection([{
      user: 'foo'
    }, {
      user: 'bar'
    }, {
      user: 'baz'
    }]);
    this.collection.totalCount = function () {
      return 3;
    };

    spyOn(this.collection, 'fetch');
    this.model = new PaginationSearchModel({}, {
      collection: this.collection
    });

    this.model.on('fetching', onFetching);
    this.model.on('fetched', onFetched);
  });

  it('should fetch a collection', function () {
    this.model.fetch();
    expect(this.collection.fetch).toHaveBeenCalled();
  });

  it('should trigger events', function () {
    this.model.fetch();
    expect(onFetching).toHaveBeenCalled();

    this.collection.trigger('sync');
    expect(onFetched).toHaveBeenCalled();
  });
});

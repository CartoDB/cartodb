var Backbone = require('backbone');
var PaginationSearchView = require('../../../../../javascripts/cartodb3/components/pagination-search/pagination-search-view');

describe('components/pagination-search/pagination-search-view', function () {
  var view;
  var fn;

  beforeEach(function () {
    fn = {
      createContentView: function () {
        return new Backbone.View();
      }
    };

    spyOn(fn, 'createContentView').and.callThrough();

    var collection = new Backbone.Collection([{
      user: 'u1'
    }, {
      user: 'u2'
    }, {
      user: 'u3'
    }]);

    spyOn(collection, 'fetch');
    collection.totalCount = function () {
      return 3;
    };

    view = new PaginationSearchView({
      listCollection: collection,
      createContentView: fn.createContentView
    });

    view.render();
  });

  it('should render filters', function () {
    expect(view.$('input.Filters-searchInput').length).toBe(1);
    expect(view.$el.html()).toContain('components.pagination-search.filter.search');
  });

  it('should render properly loading', function () {
    view._stateModel.set({state: 'loading'});
    expect(view.$('.js-loader').length).toBe(1);
    expect(view.$el.html()).toContain('components.pagination-search.loading.title');
  });

  it('should render properly show', function () {
    view._stateModel.set({state: 'show'});
    expect(fn.createContentView).toHaveBeenCalled();
  });

  it('should render properly no-results', function () {
    view._stateModel.set({state: 'no-results'});
    expect(view.$('.IntermediateInfo').length).toBe(1);
    expect(view.$el.html()).toContain('components.pagination-search.no-results.title');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});

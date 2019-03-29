const Backbone = require('backbone');
const ContentView = require('dashboard/views/data-library/content/content-view');

describe('dashboard/views/data-library/content/content-view', function () {
  let view, collection, model, template, renderSpy;

  const createViewFn = function (options) {
    collection = new Backbone.Collection({});
    collection.options = new Backbone.Model({
      page: 5,
      tags: ['rick', 'morty'],
      q: '',
      type: 'map'
    });

    model = new Backbone.Model({
      is_searching: false
    });

    template = jasmine.createSpy('template');

    renderSpy = spyOn(ContentView.prototype, 'render').and.callThrough();

    const viewOptions = Object.assign({}, { collection, model, template }, options);
    const view = new ContentView(viewOptions);

    return view;
  };

  it('throws an error when model is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        model: undefined
      });
    };

    expect(viewFactory).toThrowError('model is required');
  });

  it('throws an error when collection is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        collection: undefined
      });
    };

    expect(viewFactory).toThrowError('collection is required');
  });

  it('throws an error when template is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        template: undefined
      });
    };

    expect(viewFactory).toThrowError('template is required');
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view._template).toHaveBeenCalledWith({
        defaultUrl: '',
        page: collection.options.get('page'),
        isSearching: model.get('is_searching'),
        tag: collection.options.get('tags'),
        q: collection.options.get('q'),
        quote: jasmine.any(String),
        type: collection.options.get('type'),
        totalItems: collection.size(),
        totalEntries: collection.total_entries,
        msg: ''
      });
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      collection.add({ rick: 'morty' }, { silent: true });
    });

    it('calls render on collection add', function () {
      collection.add({ season: 3 });

      expect(renderSpy).toHaveBeenCalled();
    });

    it('calls render on collection change', function () {
      collection.at(0).set('rick', 'sanchez');

      expect(renderSpy).toHaveBeenCalled();
    });

    it('calls render on collection remove', function () {
      collection.remove(collection.at(0));

      expect(renderSpy).toHaveBeenCalled();
    });

    it('calls render on collection reset', function () {
      collection.reset();

      expect(renderSpy).toHaveBeenCalled();
    });
  });
});

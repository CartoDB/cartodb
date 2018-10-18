const $ = require('jquery');
const Backbone = require('backbone');
const ContentView = require('dashboard/views/data-library/filters/dropdown/dropdown-view');

describe('dashboard/views/data-library/filters/dropdown/dropdown-view', function () {
  let view, collection;

  const createViewFn = function (options) {
    collection = new Backbone.Collection({});
    collection.options = new Backbone.Model({
      page: 5,
      tags: ['rick', 'morty'],
      q: '',
      type: 'map'
    });

    const viewOptions = Object.assign({}, { collection }, options);
    const view = new ContentView(viewOptions);

    return view;
  };

  afterEach(function () {
    view.clean();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view.$('.js-all').length).toBe(1);
      expect(view.$('.js-categoryLink').length).toBe(6);
    });
  });

  describe('._onClickAll', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, 'hide');
    });

    it('should call .hide', function () {
      view._onClickAll();

      expect(view.hide).toHaveBeenCalled();
    });

    it('shoud reset collection options', function () {
      view._onClickAll();

      expect(collection.options.get('tags')).toEqual('');
      expect(collection.options.get('page')).toEqual(1);
    });
  });

  describe('._onClickLink', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, 'hide');

      const event = {
        target: $('<p>my_tag</p>')
      };

      view._onClickLink(event);
    });

    it('should call .hide', function () {
      expect(view.hide).toHaveBeenCalled();
    });

    it('shoud reset collection options', function () {
      expect(collection.options.get('tags')).toEqual('my_tag');
      expect(collection.options.get('page')).toEqual(1);
    });
  });
});

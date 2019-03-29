const _ = require('underscore');
const Backbone = require('backbone');
const ListView = require('dashboard/views/data-library/content/list/list-view');
const DatasetsItemView = require('dashboard/views/data-library/content/list/dataset-item-view');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/data-library/content/list/list-view', function () {
  let view, collection;

  const createViewFn = function (options) {
    collection = new Backbone.Collection([
      { id: '1_1', name: 'Rick' },
      { id: '1_2', name: 'Morty' }
    ]);
    collection.options = new Backbone.Model({
      page: 1
    });
    collection._ITEMS_PER_PAGE = 3;

    spyOn(ListView.prototype, 'render').and.callThrough();

    const viewOptions = Object.assign({}, { collection, configModel }, options);
    const view = new ListView(viewOptions);

    return view;
  };

  afterEach(function () {
    if (view) {
      view.clean();
      view = undefined;
    }
  });

  it('throws an error when configModel is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        configModel: undefined
      });
    };

    expect(viewFactory).toThrowError('configModel is required');
  });

  it('throws an error when collection is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        collection: undefined
      });
    };

    expect(viewFactory).toThrowError('collection is required');
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_addItem');
    });

    it('should call addItem for list item', function () {
      view.render();

      expect(view._addItem.calls.count()).toBe(2);
    });

    it('should add is-bottom class if there are no more items to show', function () {
      collection.total_entries = 2;

      view.render();

      expect(view.$el.hasClass('is-bottom')).toBe(true);
    });

    it('should call _fillEmptySlotsWithPlaceholderItems if collection is not empty', function () {
      spyOn(view, '_fillEmptySlotsWithPlaceholderItems');

      view.render();

      expect(view._fillEmptySlotsWithPlaceholderItems).toHaveBeenCalled();
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_addItem');
    });

    it('should call render when collection reset', function () {
      view._collection.reset();

      expect(view.render).toHaveBeenCalled();
    });

    it('should call render when collection reset', function () {
      view._collection.trigger('loaded');

      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('.show', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_addItem');
      view.render();
    });

    it('should add is-hidden class to the element', function () {
      view.$el.addClass('is-hidden');

      view.show();

      expect(view.$el.hasClass('is-hidden')).toBe(false);
    });

    it('should add is-hidden class to the element', function () {
      view.$el.removeClass('is-hidden');

      view.hide();

      expect(view.$el.hasClass('is-hidden')).toBe(true);
    });
  });

  describe('._addItem', function () {
    beforeEach(function () {
      spyOn(DatasetsItemView.prototype, 'render').and.returnValue({ el: 'dataset_item_view' });
      view = createViewFn();
    });

    it('should add a new subview', function () {
      expect(_.size(view._subviews)).toBe(0);

      view._addItem();

      expect(_.size(view._subviews)).toBe(1);
    });

    it('should create a DatasetsItemView', function () {
      const model = collection.at(0);
      let datasetItemView;

      spyOn(view, 'addView').and.callFake((view) => {
        datasetItemView = view;
      });

      view._addItem(model);

      expect(datasetItemView instanceof DatasetsItemView).toBe(true);
      expect(datasetItemView.model).toEqual(model);
      expect(datasetItemView._configModel).toEqual(configModel);
    });

    it('should append the DatasetsItemView', function () {
      view._addItem();

      expect(view.$el.html()).toContain('dataset_item_view');
    });
  });

  describe('._fillEmptySlotsWithPlaceholderItems', function () {
    beforeEach(function () {
      view = createViewFn();
      spyOn(view, '_emptySlotsCount').and.returnValue(2);
    });

    it('should add a new subview for each empty slot', function () {
      expect(_.size(view._subviews)).toBe(0);

      view._fillEmptySlotsWithPlaceholderItems();

      expect(_.size(view._subviews)).toBe(2);
    });

    it('should create a PlaceholderItem for each empty slot', function () {
      view._fillEmptySlotsWithPlaceholderItems();

      expect(view.$('.MapCard-header--fake').length).toBe(2);
    });
  });

  describe('._emptySlotsCount', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should the empty slots for the collection', function () {
      expect(view._emptySlotsCount()).toBe(1);
    });
  });
});

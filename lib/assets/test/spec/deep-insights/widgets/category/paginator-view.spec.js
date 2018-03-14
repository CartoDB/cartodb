var _ = require('underscore');
var Backbone = require('backbone');
var specHelper = require('../../spec-helper');
var CategoryWidgetModel = require('../../../../../javascripts/deep-insights/widgets/category/category-widget-model');
var PaginatorView = require('../../../../../javascripts/deep-insights/widgets/category/paginator/paginator-view');

describe('widgets/category/paginator-view', function () {
  var view, renderSpy;

  var createViewFn = function (options) {
    var vis = specHelper.createDefaultVis();
    var layerModel = vis.map.layers.first();
    var source = vis.analysis.findNodeById('a0');

    var dataviewModel = vis.dataviews.createCategoryModel({
      column: 'col',
      source: source
    });

    var widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: dataviewModel,
      layerModel: layerModel
    });

    var viewOptions = _.extend({
      widgetModel: widgetModel,
      dataviewModel: dataviewModel,
      paginatorModel: new Backbone.Model({
        page: 1
      })
    }, options);

    return new PaginatorView(viewOptions);
  };

  beforeEach(function () {
    renderSpy = spyOn(PaginatorView.prototype, 'render');
    spyOn(PaginatorView.prototype, '_onDataChanged').and.callThrough();
    spyOn(PaginatorView.prototype, 'toggle').and.callThrough();

    view = createViewFn();
  });

  afterEach(function () {
    view.clean();
    view = undefined;
  });

  describe('.render', function () {
    beforeEach(function () {
      renderSpy.and.callThrough();
    });

    describe('when categories are smaller than the minimum categories', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$('.js-searchToggle').length).toBe(0);
      });
    });

    describe('when categories are bigger than the minimum categories', function () {
      beforeEach(function () {
        spyOn(view._dataviewModel, 'getCount').and.returnValue(10);
      });

      it('should render properly', function () {
        view.render();

        expect(view.$('.js-searchToggle').length).toBe(1);
      });

      describe('when paginator is true', function () {
        it('should render properly', function () {
          view.options.paginator = true;
          view.render();

          expect(view.$('.js-prev').length).toBe(1);
          expect(view.$('.js-next').length).toBe(1);
        });
      });
    });
  });

  describe('.initBinds', function () {
    it('calls .render when model page changes', function () {
      view._paginatorModel.set({ page: 1337 });

      expect(view.render).toHaveBeenCalled();
    });

    it('calls .render when dataviewModel categoriesCount changes', function () {
      view._dataviewModel.set({ categoriesCount: 1337 });

      expect(view.render).toHaveBeenCalled();
    });

    it('calls ._onDataChanged when dataviewModel data or searchData changes', function () {
      view._dataviewModel.set({ data: 'someData' });
      view._dataviewModel.set({ searchData: 'someData' });

      expect(view._onDataChanged).toHaveBeenCalledTimes(2);
    });

    it('calls .toggle when widgetModel search changes', function () {
      view._widgetModel.set({ search: 1337 });

      expect(view.toggle).toHaveBeenCalled();
    });
  });

  describe('._setPage', function () {
    beforeEach(function () {
      spyOn(view, '_totalPages').and.returnValue(10);
    });

    it('sets the page to 1 if the page is smaller than 1', function () {
      var initialPage = -5;
      var expectedPage = 1;

      view._paginatorModel.set({ page: initialPage }, { silent: true });

      view._setPage();

      expect(view._paginatorModel.get('page')).toEqual(expectedPage);
    });

    it('sets the page to 1 if the page is bigger than the total', function () {
      var initialPage = 1337;
      var expectedPage = 1;

      view._paginatorModel.set({ page: initialPage }, { silent: true });

      view._setPage();

      expect(view._paginatorModel.get('page')).toEqual(expectedPage);
    });
  });

  describe('._onSearchClicked', function () {
    it('calls widgetModel.setupSearch', function () {
      view._widgetModel.setupSearch = jasmine.createSpy('setupSearch');

      view._onSearchClicked();

      expect(view._widgetModel.setupSearch).toHaveBeenCalled();
    });
  });

  describe('._onDataChanged', function () {
    it('calls _setPage', function () {
      spyOn(view, '_setPage');

      view._onDataChanged();

      expect(view._setPage).toHaveBeenCalled();
    });

    it('calls render', function () {
      view._onDataChanged();

      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('._onPrevPage', function () {
    it('calls _changePage with a negative step', function () {
      spyOn(view, '_changePage');

      view._onPrevPage();

      expect(view._changePage).toHaveBeenCalledWith(-1);
    });
  });

  describe('._onNextPage', function () {
    it('calls _changePage a positive step', function () {
      spyOn(view, '_changePage');

      view._onNextPage();

      expect(view._changePage).toHaveBeenCalledWith(1);
    });
  });

  describe('._changePage', function () {
    beforeEach(function () {
      spyOn(PaginatorView.prototype, '_totalPages').and.returnValue(77);
    });

    it('changes the model page based on the step', function () {
      var initialPage = 10;
      var expectedPage = 15;

      view._paginatorModel.set({ page: initialPage }, { silent: true });

      view._changePage(5);

      expect(view._paginatorModel.get('page')).toEqual(expectedPage);
    });

    it('sets the page to 1 if the nextPage is bigger than the total', function () {
      var initialPage = 5;
      var expectedPage = 1;

      view._paginatorModel.set({ page: initialPage }, { silent: true });

      view._changePage(100);

      expect(view._paginatorModel.get('page')).toEqual(expectedPage);
    });

    it('sets the page to the total if the nextPage is smaller than 1', function () {
      var initialPage = 5;
      var expectedPage = 77;

      view._paginatorModel.set({ page: initialPage }, { silent: true });

      view._changePage(-100);

      expect(view._paginatorModel.get('page')).toEqual(expectedPage);
    });
  });

  describe('._totalPages', function () {
    it('returns the total pages divided by the items per page', function () {
      var collectionSize = 10;
      var itemsPerPage = 3;

      spyOn(view._dataviewModel, 'getSize').and.returnValue(collectionSize);
      view.options.itemsPerPage = itemsPerPage;

      var expectedPages = Math.ceil(collectionSize / itemsPerPage);

      expect(view._totalPages()).toEqual(expectedPages);
    });
  });

  describe('.toggle', function () {
    it('calls hide if widgetModel search is enabled', function () {
      spyOn(view._widgetModel, 'isSearchEnabled').and.returnValue(true);
      spyOn(view, 'hide');

      view.toggle();

      expect(view.hide).toHaveBeenCalled();
    });

    it('calls hide if widgetModel search is disabled', function () {
      spyOn(view._widgetModel, 'isSearchEnabled').and.returnValue(false);
      spyOn(view, 'show');

      view.toggle();

      expect(view.show).toHaveBeenCalled();
    });
  });

  describe('.hide', function () {
    it('adds is-hidden class to the element', function () {
      view.$el.removeClass('is-hidden');

      view.hide();

      expect(view.$el.hasClass('is-hidden')).toBe(true);
    });
  });

  describe('.show', function () {
    it('removes is-hidden class to the element', function () {
      view.$el.addClass('is-hidden');

      view.show();

      expect(view.$el.hasClass('is-hidden')).toBe(false);
    });
  });
});

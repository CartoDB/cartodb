var specHelper = require('../../spec-helper');
var Backbone = require('backbone');
var CategoryWidgetModel = require('../../../../../javascripts/deep-insights/widgets/category/category-widget-model');
var ItemsView = require('../../../../../javascripts/deep-insights/widgets/category/list/items-view');

describe('widgets/category/items-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.layerModel = vis.map.layers.first();

    var source = vis.analysis.findNodeById('a0');
    this.dataviewModel = vis.dataviews.createCategoryModel({
      column: 'col',
      source: source
    });

    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel
    });

    spyOn(ItemsView.prototype, 'render').and.callThrough();
    spyOn(ItemsView.prototype, 'toggle').and.callThrough();
    spyOn(ItemsView.prototype, 'blockFiltering').and.callThrough();

    this.view = new ItemsView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel,
      paginatorModel: new Backbone.Model({
        page: 1
      })
    });
  });

  describe('render', function () {
    it('should render placeholder when data is empty', function () {
      spyOn(this.view, '_renderPlaceholder').and.callThrough();
      this.view.render();
      expect(this.view._renderPlaceholder).toHaveBeenCalled();
      expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeTruthy();
      expect(this.view.$el.hasClass('CDB-Widget-list--wrapped')).toBeFalsy();
    });

    describe('when have at least one category', function () {
      beforeEach(function () {
        this.dataviewModel.sync = function (method, model, options) {
          options.success({
            'categories': [
              {category: 'Hey'},
              {category: 'test'}
            ]
          });
        };
        this.dataviewModel.fetch();
        this.view.render();
      });

      it('should render properly a list of categories', function () {
        expect(this.view.$('.CDB-Widget-listItem').length).toBe(2);
        expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeFalsy();
      });
    });
  });

  describe('blockFiltering', function () {
    it('should add nodynamic class to widget-list', function () {
      this.dataviewModel.set('sync_on_bbox_change', false);

      expect(this.view.$el.hasClass('CDB-Widget-list--nodynamic')).toBeTruthy();
    });
  });

  describe('.initBinds', function () {
    it('should render when any data has changed (origin or search data)', function () {
      this.dataviewModel.trigger('change:data');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should toggle view when search is enabled/disabled', function () {
      this.widgetModel.trigger('change:search');

      expect(this.view.toggle).toHaveBeenCalled();
    });

    it('should toggle filtering view when sync_on_bbox_change enabled/disabled', function () {
      this.dataviewModel.trigger('change:sync_on_bbox_change', { changed: {} });

      expect(this.view.blockFiltering).toHaveBeenCalled();
    });
  });
});

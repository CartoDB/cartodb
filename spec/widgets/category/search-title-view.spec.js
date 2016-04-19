var specHelper = require('../../spec-helper');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var SearchTitleView = require('../../../src/widgets/category/title/search-title-view');

describe('widgets/category/search-title-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    var layer = vis.map.layers.first();
    layer.restoreCartoCSS = jasmine.createSpy('restore');
    this.dataviewModel = vis.dataviews.createCategoryModel(layer, {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new SearchTitleView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  });

  it('should render properly', function () {
    this.view.render();
    var $el = this.view.$el;
    expect($el.find('.js-title').length).toBe(1);
    expect($el.find('.CDB-Widget-options').length).toBe(1);
    expect($el.find('.js-titleText').length).toBe(1);
  });

  describe('search', function () {
    beforeEach(function () {
      this.widgetModel.toggleSearch();
    });

    it('should render search form properly', function () {
      expect(this.view.$('.CDB-Widget-search').length).toBe(1);
      expect(this.view.$('.js-searchIcon').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textInput').length).toBe(1);
      expect(this.view.$('.CDB-Widget-searchApply').length).toBe(0);
    });

    it('should trigger search when text input changes', function () {
      spyOn(this.dataviewModel, 'applySearch');
      this.view.$('.js-textInput').val('ES');
      this.view._onSubmitForm();
      expect(this.dataviewModel.applySearch).toHaveBeenCalled();
    });

    it('should not trigger search when text input changes are not valid', function () {
      spyOn(this.dataviewModel, 'applySearch');
      this.view.$('.js-textInput').val('');
      this.view._onSubmitForm();
      expect(this.dataviewModel.applySearch).not.toHaveBeenCalled();
    });

    it('should not trigger search when text input changes are same as last search query value', function () {
      spyOn(this.dataviewModel, 'applySearch');
      this.dataviewModel.setSearchQuery('ES');
      this.view.$('.js-textInput').val('ES');
      this.view._onSubmitForm();
      expect(this.dataviewModel.applySearch).not.toHaveBeenCalled();
    });

    it('should show apply button when there is any change to apply', function () {
      this.dataviewModel.filter.accept('test');
      expect(this.view.$('.CDB-Widget-searchApply').length).toBe(1);
    });

    it('should apply locked categories when apply button is clicked', function () {
      spyOn(this.widgetModel, 'applyLocked');
      this.dataviewModel.filter.accept('one');
      this.view.$('.js-applyLocked').click();
      expect(this.widgetModel.applyLocked).toHaveBeenCalled();
    });
  });

  describe('options', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render "apply colors" button and apply them when is clicked', function () {
      expect(this.view.$('.js-autoStyle').length).toBe(1);
      spyOn(this.widgetModel, 'autoStyle').and.callThrough();
      this.view.$('.js-autoStyle').click();
      expect(this.widgetModel.autoStyle).toHaveBeenCalled();
      expect(this.view.$('.js-autoStyle').length).toBe(0);
      expect(this.view.$('.js-cancelAutoStyle').length).toBe(1);
    });

    it('should remove category colors when they are applied and button is clicked', function () {
      spyOn(this.widgetModel, 'cancelAutoStyle').and.callThrough();
      this.view.$('.js-autoStyle').click();
      expect(this.view.$('.js-cancelAutoStyle').hasClass('is-selected')).toBeTruthy();
      this.view.$('.js-cancelAutoStyle').click();
      expect(this.widgetModel.cancelAutoStyle).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});

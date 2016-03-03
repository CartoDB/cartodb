var specHelper = require('../../spec-helper');
var Backbone = require('backbone');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var OptionsView = require('../../../src/widgets/category/options/options-view');

describe('widgets/category/options-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new OptionsView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  });

  it('should render properly', function () {
    this.dataviewModel.sync = function (method, model, options) {
      options.success({
        'categories': [
          {category: 'test'}
        ]
      });
    };
    this.dataviewModel.fetch();
    this.view.render();
    var $el = this.view.$el;
    expect($el.find('.js-textInfo').length).toBe(1);
    expect($el.find('.CDB-Widget-link').length).toBe(0);
  });

  describe('bind', function () {
    beforeEach(function () {
      spyOn(this.dataviewModel, 'bind');
      spyOn(this.widgetModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any of this events are triggered from data model', function () {
      var bind = this.dataviewModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:data');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search is enabled/disabled', function () {
      var bind = this.widgetModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:search');
      expect(bind[0]).toContain('change:locked');
      expect(bind[1]).toEqual(this.view.render);
    });
  });

  describe('when locked state changes', function () {
    beforeEach(function () {
      this.widgetModel.lockCategories();
    });

    it('should render locked state', function () {
      expect(this.view.$el.html()).toContain('blocked');
      expect(this.view.$el.html()).toContain('unlock');
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.dataviewModel._data.reset([{ category: 'test' }, { category: 'hey' }, { category: 'meh' }]);
    });

    it('should render selected all from the beginning', function () {
      this.view.render();
      expect(this.view.$('.js-textInfo').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('All selected');
    });

    it('should render accepted categories if there is any accepted category', function () {
      this.dataviewModel.filter.accept('paco');
      this.view.render();
      expect(this.view.$('.js-textInfo').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('1 selected');
    });

    it('should render only a text with locked/selected items when search is enabled', function () {
      spyOn(this.widgetModel, 'isSearchEnabled').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.js-lockCategories').length).toBe(1);
      expect(this.view.$('.js-lockCategories').text()).toContain('0 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(0);
    });

    it('should render number of locked items and unlock button if widget is locked', function () {
      spyOn(this.widgetModel, 'isLocked').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.js-textInfo').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('3 blocked');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should render number of selected items and lock button if widget is still not locked', function () {
      spyOn(this.widgetModel, 'isLocked').and.returnValue(false);
      this.dataviewModel._data.reset([{ name: 'test' }, { name: 'one' }, { name: 'two' }]);
      this.dataviewModel.filter.accept('one');
      expect(this.view.$('.js-textInfo').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-textInfo').length).toBe(1);
    });

    it('should render filter buttons if widget is neither locked nor search enabled', function () {
      spyOn(this.widgetModel, 'isLocked').and.returnValue(false);
      spyOn(this.widgetModel, 'isSearchEnabled').and.returnValue(false);
      spyOn(this.dataviewModel, 'getData').and.returnValue(new Backbone.Collection([{ name: 'hey' }, { name: 'buddy' }, { name: 'neno' }]));
      this.dataviewModel.filter.accept('hey');
      expect(this.view.$('.js-textInfo').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-all').length).toBe(1);
    });

    it('should render all button selected text if all categories are rejected', function () {
      spyOn(this.dataviewModel.filter, 'areAllRejected').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(1);
      expect(this.view.$('.js-textInfo').text()).toContain('None selected');
    });

    it('should not render all button when there are less than 2 categories', function () {
      spyOn(this.dataviewModel, 'getData').and.returnValue(new Backbone.Collection([{ name: 'hey' }, { name: 'buddy' }]));
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(0);
    });
  });

  it('should accept all when all button is clicked', function () {
    spyOn(this.dataviewModel.filter, 'acceptAll');
    spyOn(this.dataviewModel, 'getData').and.returnValue(new Backbone.Collection([{ name: 'hey' }, { name: 'buddy' }, { name: 'neno' }]));
    this.dataviewModel.filter.accept('hey');
    this.view.render();
    this.view.$('.js-all').click();
    expect(this.dataviewModel.filter.acceptAll).toHaveBeenCalled();
  });

  describe('lock', function () {
    beforeEach(function () {
      this.dataviewModel._data.reset([{ name: 'one' }, { name: 'buddy' }, { name: 'neno' }]);
    });

    it('should render "locked" button and apply them when is clicked', function () {
      this.dataviewModel.filter.accept('one');
      expect(this.view.$('.js-lock').length).toBe(1);
      spyOn(this.widgetModel, 'lockCategories').and.callThrough();
      this.view.$('.js-lock').click();
      expect(this.widgetModel.lockCategories).toHaveBeenCalled();
      expect(this.view.$('.js-lock').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should unlock when widget is locked and button is clicked', function () {
      spyOn(this.widgetModel, 'unlockCategories').and.callThrough();
      this.dataviewModel.filter.accept('one');
      this.view.$('.js-lock').click();
      expect(this.view.$('.js-unlock').length).toBe(1);
      this.view.$('.js-unlock').click();
      expect(this.widgetModel.unlockCategories).toHaveBeenCalled();
    });
  });
});

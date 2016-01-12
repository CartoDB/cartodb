var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var OptionsView = require('../../../src/widgets/category/options/options-view');

describe('widgets/category/options-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.model = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
    this.viewModel = new CategoryWidgetModel({}, {
      dataviewModel: this.model
    });
    this.view = new OptionsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  it('should render properly', function () {
    this.model.sync = function (method, model, options) {
      options.success({
        'categories': [
          {category: 'test'}
        ]
      });
    };
    this.model.fetch();
    this.view.render();
    var $el = this.view.$el;
    expect($el.find('.CDB-Widget-textSmaller').length).toBe(1);
    expect($el.find('.CDB-Widget-link').length).toBe(1);
    expect($el.find('.CDB-Widget-link').text()).toBe('none');
  });

  describe('bind', function () {
    beforeEach(function () {
      spyOn(this.model, 'bind');
      spyOn(this.viewModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any of this events are triggered from data model', function () {
      var bind = this.model.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:data');
      expect(bind[0]).toContain('change:filter');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search is enabled/disabled', function () {
      var bind = this.viewModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:search');
      expect(bind[0]).toContain('change:locked');
      expect(bind[1]).toEqual(this.view.render);
    });
  });

  describe('when locked state changes', function () {
    beforeEach(function () {
      this.viewModel.lockCategories();
    });

    it('should render locked state', function () {
      expect(this.view.$el.html()).toContain('blocked');
      expect(this.view.$el.html()).toContain('unlock');
    });
  });

  describe('render', function () {
    it('should render selected all from the beginning', function () {
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('All selected');
    });

    it('should render only a text with locked/selected items when search is enabled', function () {
      spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('0 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(0);
    });

    it('should render number of locked items and unlock button if widget is locked', function () {
      spyOn(this.viewModel, 'isLocked').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('0 blocked');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should render number of selected items and lock button if widget is still not locked', function () {
      spyOn(this.viewModel, 'isLocked').and.returnValue(false);
      this.model.sync = function (method, model, options) {
        options.success({
          'categories': [
            {category: 'test'},
            {category: 'one'}
          ]
        });
      };
      this.model.fetch();
      this.model.filter.accept('one');
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-lock').length).toBe(1);
    });

    it('should render filter buttons if widget is neither locked nor search enabled', function () {
      spyOn(this.viewModel, 'isLocked').and.returnValue(false);
      spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(false);
      this.model.filter.accept('Hey');
      this.model.sync = function (method, model, options) {
        options.success({
          'categories': [
            {category: 'Hey'},
            {category: 'Buddy'}
          ]
        });
      };
      this.model.fetch();
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-all').length).toBe(1);
      expect(this.view.$('.js-none').length).toBe(1);
    });

    it('should render all button and none selected text if all categories are rejected', function () {
      spyOn(this.model.filter, 'areAllRejected').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(1);
      expect(this.view.$('.js-none').length).toBe(0);
      expect(this.view.$('p.CDB-Widget-textSmaller').text()).toContain('None selected');
    });

    it('should render none button if all categories are not rejected', function () {
      spyOn(this.model.filter, 'areAllRejected').and.returnValue(false);
      this.model.sync = function (method, model, options) {
        options.success({
          'categories': [
            {category: 'Hey'},
            {category: 'Buddy'}
          ]
        });
      };
      this.model.fetch();
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(0);
      expect(this.view.$('.js-none').length).toBe(1);
    });
  });

  it('should reject all when none button is clicked', function () {
    spyOn(this.model.filter, 'rejectAll');
    this.model.sync = function (method, model, options) {
      options.success({
        'categories': [
          {category: 'Hey'},
          {category: 'Buddy'}
        ]
      });
    };
    this.model.fetch();
    this.view.render();
    this.view.$('.js-none').click();
    expect(this.model.filter.rejectAll).toHaveBeenCalled();
  });

  it('should accept all when all button is clicked', function () {
    spyOn(this.model.filter, 'acceptAll');
    this.model.sync = function (method, model, options) {
      options.success({
        'categories': [
          {category: 'Hey'},
          {category: 'Buddy'}
        ]
      });
    };
    this.model.fetch();
    this.model.filter.accept('Hey');
    this.view.render();
    this.view.$('.js-all').click();
    expect(this.model.filter.acceptAll).toHaveBeenCalled();
  });

  describe('lock', function () {
    it('should render "locked" button and apply them when is clicked', function () {
      this.model.filter.accept('one');
      expect(this.view.$('.js-lock').length).toBe(1);
      spyOn(this.viewModel, 'lockCategories').and.callThrough();
      this.view.$('.js-lock').click();
      expect(this.viewModel.lockCategories).toHaveBeenCalled();
      expect(this.view.$('.js-lock').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should unlock when widget is locked and button is clicked', function () {
      spyOn(this.viewModel, 'unlockCategories').and.callThrough();
      this.model.filter.accept('one');
      this.view.$('.js-lock').click();
      expect(this.view.$('.js-unlock').length).toBe(1);
      this.view.$('.js-unlock').click();
      expect(this.viewModel.unlockCategories).toHaveBeenCalled();
    });
  });
});

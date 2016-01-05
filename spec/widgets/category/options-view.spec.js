var CategoryDataviewModel = require('../../../src/dataviews/category-dataview-model');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var OptionsView = require('../../../src/widgets/category/options/options-view');
var WindshaftFiltersCategory = require('../../../src/windshaft/filters/category');

describe('widgets/category/options-view', function () {
  beforeEach(function () {
    this.model = new CategoryDataviewModel(null, {
      filter: new WindshaftFiltersCategory()
    });
    this.viewModel = new CategoryWidgetModel({}, {
      dataviewModel: this.model
    });
    this.view = new OptionsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  it('should render properly', function () {
    this.model.setCategories([{ name: 'test' }]);
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
      expect(bind[0]).toEqual('change:data change:filter change:locked change:lockCollection');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search is enabled/disabled', function () {
      var bind = this.viewModel.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:search');
      expect(bind[1]).toEqual(this.view.render);
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
      spyOn(this.model, 'isLocked').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('0 blocked');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should render number of selected items and lock button if widget is still not locked', function () {
      spyOn(this.model, 'isLocked').and.returnValue(false);
      this.model.setCategories([{ name: 'test' }, { name: 'one' }]);
      this.model.acceptFilters('one');
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-lock').length).toBe(1);
    });

    it('should render filter buttons if widget is neither locked nor search enabled', function () {
      spyOn(this.model, 'isLocked').and.returnValue(false);
      spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(false);
      this.model.acceptFilters('Hey');
      this.model.setCategories([{ name: 'Hey' }, { name: 'Buddy' }]);
      this.view.render();
      expect(this.view.$('.CDB-Widget-textSmaller').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textSmaller').text()).toContain('1 selected');
      expect(this.view.$('.CDB-Widget-filterButtons').length).toBe(1);
      expect(this.view.$('.js-all').length).toBe(1);
      expect(this.view.$('.js-none').length).toBe(1);
    });

    it('should render all button and none selected text if all categories are rejected', function () {
      spyOn(this.model, 'isAllFiltersRejected').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(1);
      expect(this.view.$('.js-none').length).toBe(0);
      expect(this.view.$('p.CDB-Widget-textSmaller').text()).toContain('None selected');
    });

    it('should render none button if all categories are not rejected', function () {
      spyOn(this.model, 'isAllFiltersRejected').and.returnValue(false);
      this.model.setCategories([{ name: 'Hey' }, { name: 'Buddy' }]);
      this.view.render();
      expect(this.view.$('.js-all').length).toBe(0);
      expect(this.view.$('.js-none').length).toBe(1);
    });
  });

  it('should reject all when none button is clicked', function () {
    spyOn(this.model, 'rejectAll');
    this.model.setCategories([{ name: 'Hey' }, { name: 'Buddy' }]);
    this.view.render();
    this.view.$('.js-none').click();
    expect(this.model.rejectAll).toHaveBeenCalled();
  });

  it('should accept all when all button is clicked', function () {
    spyOn(this.model, 'acceptAll');
    this.model.setCategories([{ name: 'Hey' }, { name: 'Buddy' }]);
    this.model.acceptFilters('Hey');
    this.view.render();
    this.view.$('.js-all').click();
    expect(this.model.acceptAll).toHaveBeenCalled();
  });

  describe('lock', function () {
    it('should render "locked" button and apply them when is clicked', function () {
      this.model.acceptFilters('one');
      expect(this.view.$('.js-lock').length).toBe(1);
      spyOn(this.model, 'lockCategories').and.callThrough();
      this.view.$('.js-lock').click();
      expect(this.model.lockCategories).toHaveBeenCalled();
      expect(this.view.$('.js-lock').length).toBe(0);
      expect(this.view.$('.js-unlock').length).toBe(1);
    });

    it('should unlock when widget is locked and button is clicked', function () {
      spyOn(this.model, 'unlockCategories').and.callThrough();
      this.model.acceptFilters('one');
      this.view.$('.js-lock').click();
      expect(this.view.$('.js-unlock').length).toBe(1);
      this.view.$('.js-unlock').click();
      expect(this.model.unlockCategories).toHaveBeenCalled();
    });
  });
});

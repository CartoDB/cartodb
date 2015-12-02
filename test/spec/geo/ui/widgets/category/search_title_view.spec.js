var _ = require('underscore');
var CategoryModel = require('cdb/geo/ui/widgets/category/model.js');
var ViewModel = require('cdb/geo/ui/widgets/widget_content_model.js');
var SearchTitleView = require('cdb/geo/ui/widgets/category/title/search_title_view.js');
var WindshaftFiltersCategory = require('cdb/windshaft/filters/category');
var $ = require('jquery');

describe('widgets/category/search_title_view', function() {

  beforeEach(function() {
    this.model = new CategoryModel(null, {
      filter: new WindshaftFiltersCategory()
    });
    this.viewModel = new ViewModel();
    this.view = new SearchTitleView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  it('should render properly', function() {
    this.view.render();
    var $el = this.view.$el;
    expect($el.find('.CDB-Widget-title').length).toBe(1);
    expect($el.find('.CDB-Widget-options').length).toBe(1);
    expect($el.find('.CDB-Widget-textBig').length).toBe(1);
  });

  describe('binds', function() {
    beforeEach(function() {
      spyOn(this.viewModel, 'bind').and.callThrough();
      spyOn(this.model, 'bind').and.callThrough();
      this.view._initBinds();
    });

    it('should change to search state when search event is triggered', function() {
      expect(this.viewModel.bind.calls.argsFor(0)[0]).toEqual('change:search');
    });

    it('should change to search state when search event is triggered', function() {
      expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:filter change:lockCollection change:categoryColors change:collapsed');
    });
  });

  describe('search', function() {
    beforeEach(function() {
      this.viewModel.toggleSearch();
    });

    it('should render search form properly', function() {
      expect(this.view.$('.CDB-Widget-search').length).toBe(1);
      expect(this.view.$('.CDB-Widget-searchLens').length).toBe(1);
      expect(this.view.$('.CDB-Widget-textInput').length).toBe(1);
      expect(this.view.$('.CDB-Widget-searchApply').length).toBe(0);
    });

    it('should trigger search when text input changes', function() {
      spyOn(this.model, 'applySearch');
      this.view.$('.js-textInput').val('ES');
      this.view._onSubmitForm();
      expect(this.model.applySearch).toHaveBeenCalled();
    });

    it('should not trigger search when text input changes are not valid', function() {
      spyOn(this.model, 'applySearch');
      this.view.$('.js-textInput').val('');
      this.view._onSubmitForm();
      expect(this.model.applySearch).not.toHaveBeenCalled();
    });

    it('should not trigger search when text input changes are same as last search query value', function() {
      spyOn(this.model, 'applySearch');
      this.model.setSearchQuery('ES');
      this.view.$('.js-textInput').val('ES');
      this.view._onSubmitForm();
      expect(this.model.applySearch).not.toHaveBeenCalled();
    });

    it('should show apply button when there is any change to apply', function() {
      this.model.acceptFilters('test');
      expect(this.view.$('.CDB-Widget-searchApply').length).toBe(1);
    });

    it('should apply locked categories when apply button is clicked', function() {
      spyOn(this.model, 'applyLocked');
      this.model.acceptFilters('one');
      this.view.$('.js-applyLocked').click();
      expect(this.model.applyLocked).toHaveBeenCalled();
    });

  });


  describe('options', function() {
    beforeEach(function() {
      this.view.render();
    });

    it('should render "apply colors" button and apply them when is clicked', function(){
      expect(this.view.$('.js-applyColors').length).toBe(1);
      spyOn(this.model, 'applyCategoryColors').and.callThrough();
      this.view.$('.js-applyColors').click();
      expect(this.model.applyCategoryColors).toHaveBeenCalled();
      expect(this.view.$('.js-applyColors').length).toBe(0);
      expect(this.view.$('.js-cancelColors').length).toBe(1);
    });

    it('should remove category colors when they are applied and button is clicked', function() {
      spyOn(this.model, 'cancelCategoryColors').and.callThrough();
      this.view.$('.js-applyColors').click();
      expect(this.view.$('.js-cancelColors').hasClass('is-selected')).toBeTruthy();
      this.view.$('.js-cancelColors').click();
      expect(this.model.cancelCategoryColors).toHaveBeenCalled();
    });

    it('should call to collapse function when it is clicked', function() {
      spyOn(this.model, 'toggleCollapsed').and.callThrough();
      this.view.$('.js-collapse').click();
      expect(this.model.toggleCollapsed).toHaveBeenCalled();
    });

  });

  afterEach(function() {
    this.view.clean();
  });

});

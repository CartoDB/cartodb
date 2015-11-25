var _ = require('underscore');
var CategoryModel = require('cdb/geo/ui/widgets/category/model.js');
var ViewModel = require('cdb/geo/ui/widgets/widget_content_model.js');
var StatsView = require('cdb/geo/ui/widgets/category/stats/stats_view.js');
var WindshaftFiltersCategory = require('cdb/windshaft/filters/category');
var $ = require('jquery');

describe('widgets/category/stats_view', function() {

  beforeEach(function() {
    this.model = new CategoryModel(null, {
      filter: new WindshaftFiltersCategory()
    });
    this.viewModel = new ViewModel();
    this.view = new StatsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  describe('render', function() {
    it('should render properly data stats', function() {
      this.view.render();
      expect(this.view.$('.Widget-infoItem').length).toBe(3);
    });

    it('should show number of results when a search is applied', function() {
      spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(true);
      spyOn(this.model, 'isSearchApplied').and.returnValue(true);
      spyOn(this.model, 'getSearchCount').and.returnValue(10);
      this.view.render();
      expect(this.view.$('.Widget-infoItem').length).toBe(1);
      expect(this.view.$('.Widget-infoItem').text()).toContain('10 found');
    });

    it('should nothing when search is enabled but not applied', function() {
      spyOn(this.viewModel, 'isSearchEnabled').and.returnValue(true);
      spyOn(this.model, 'isSearchApplied').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Widget-infoItem').length).toBe(1);
      expect(this.view.$('.Widget-infoItem').text()).not.toContain('found');
    });
  });

  describe('bind', function() {

    beforeEach(function() {
      spyOn(this.model, 'bind');
      spyOn(this.viewModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any of this events are triggered from data model', function() {
      var bind = this.model.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:data change:locked change:search');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search is enabled/disabled', function() {
      var bind = this.viewModel.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:search');
      expect(bind[1]).toEqual(this.view.render);
    });

  });

});

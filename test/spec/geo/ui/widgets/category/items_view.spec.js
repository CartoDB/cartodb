var _ = require('underscore');
var CategoryModel = require('cdb/geo/ui/widgets/category/model.js');
var ViewModel = require('cdb/geo/ui/widgets/widget_content_model.js');
var ItemsView = require('cdb/geo/ui/widgets/category/list/items_view.js');
var WindshaftFiltersCategory = require('cdb/windshaft/filters/category');
var $ = require('jquery');

describe('widgets/category/items_view', function() {

  beforeEach(function() {
    this.model = new CategoryModel(null, {
      filter: new WindshaftFiltersCategory()
    });
    this.viewModel = new ViewModel();
    this.view = new ItemsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
  });

  describe('render', function() {

    it('should render placeholder when data is empty', function() {
      spyOn(this.view, '_renderPlaceholder').and.callThrough();
      this.model.setCategories([]);
      this.view.render();
      expect(this.view._renderPlaceholder).toHaveBeenCalled();
      expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeTruthy();
      expect(this.view.$el.hasClass('CDB-Widget-list--wrapped')).toBeFalsy();
    });

    it('should render properly a list of categories', function() {
      this.model.setCategories([{ name: 'Hey' }, { name: 'test' }]);
      this.view.render();
      expect(this.view.$('.CDB-Widget-listGroup').length).toBe(1);
      expect(this.view.$('.CDB-Widget-listItem').length).toBe(2);
      expect(this.view.$el.hasClass('CDB-Widget-list--withBorders')).toBeFalsy();
    });

  });

  describe('bind', function() {

    beforeEach(function() {
      spyOn(this.model, 'bind');
      spyOn(this.viewModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any data has changed (origin or search data)', function() {
      var bind = this.model.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:data change:searchData');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should toggle view when search is enabled/disabled', function() {
      var bind = this.viewModel.bind.calls.argsFor(0);
      expect(bind[0]).toEqual('change:search');
      expect(bind[1]).toEqual(this.view.toggle);
    });

  });

});

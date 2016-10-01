var Backbone = require('backbone');
var TableHeadView = require('../../../../../../javascripts/cartodb3/components/table/head/table-head-view');
var TableViewModel = require('../../../../../../javascripts/cartodb3/components/table/table-view-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../javascripts/cartodb3/data/query-geometry-model');

describe('components/table/head/table-head-view', function () {
  beforeEach(function () {
    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched',
      query: 'SELECT * FROM pepito'
    }, {
      configModel: {}
    });
    this.queryGeometryModel = new QueryGeometryModel({
      status: 'fetched',
      simple_geom: 'point',
      query: 'SELECT * FROM pepito'
    }, {
      configModel: {}
    });
    this.tableViewModel = new TableViewModel({}, {
      querySchemaModel: this.querySchemaModel
    });
    this.columnsCollection = new Backbone.Collection([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'description',
        type: 'string'
      }
    ]);
    this.view = new TableHeadView({
      columnsCollection: this.columnsCollection,
      tableViewModel: this.tableViewModel,
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: this.queryGeometryModel,
      modals: {}
    });
  });

  describe('render', function () {
    beforeEach(function () {
      spyOn(this.view, '_renderColumnHead').and.callThrough();
      this.view.render();
    });

    it('should render as many columns as column collection items has', function () {
      expect(this.view._renderColumnHead).toHaveBeenCalled();
      expect(this.view._renderColumnHead.calls.count()).toBe(2);
      expect(this.view.$('.Table-headItem').length).toBe(2);
    });
  });

  describe('binds', function () {
    beforeEach(function () {
      spyOn(this.view, 'render').and.callThrough();
      spyOn(this.view, '_scrollToLeft');
      this.view.render();
    });

    it('should render when table view model changes its sort', function () {
      this.tableViewModel.set('sort_order', 'desc');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should render when table view model changes its order', function () {
      this.tableViewModel.set('order_by', 'description');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should render when simple geometry has changed', function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should scroll to left when a new element is added', function () {
      jasmine.clock().install();

      this.columnsCollection.add({
        name: 'hey',
        type: 'date'
      });
      // When a new column is added, query schema modal is fetched,
      // then columnsCollection is reseted again.
      this.columnsCollection.trigger('reset');
      jasmine.clock().tick(501);
      expect(this.view._scrollToLeft).toHaveBeenCalled();

      this.view._scrollToLeft.calls.reset();
      this.columnsCollection.remove(this.columnsCollection.at(2));
      this.columnsCollection.trigger('reset');
      jasmine.clock().tick(501);
      expect(this.view._scrollToLeft).not.toHaveBeenCalled();

      jasmine.clock().uninstall();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

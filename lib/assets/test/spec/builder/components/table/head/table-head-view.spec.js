var Backbone = require('backbone');
var TableHeadView = require('builder/components/table/head/table-head-view');
var TableViewModel = require('builder/components/table/table-view-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QueryColumnModel = require('builder/data/query-column-model');
var configModelFixture = require('fixtures/builder/config-model.fixture');
var FactoryModals = require('../../../factories/modals');

describe('components/table/head/table-head-view', function () {
  beforeEach(function () {
    var configModel = this.configModel = configModelFixture();
    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched',
      query: 'SELECT * FROM pepito'
    }, {
      configModel: configModel
    });
    this.queryGeometryModel = new QueryGeometryModel({
      status: 'fetched',
      simple_geom: 'point',
      query: 'SELECT * FROM pepito'
    }, {
      configModel: configModel
    });
    this.analysisDefinitionNodeModel = new Backbone.Model();
    this.analysisDefinitionNodeModel.isReadOnly = function () {
      return false;
    };
    this.analysisDefinitionNodeModel.isCustomQueryApplied = function () { return false; };

    this.tableViewModel = new TableViewModel({
      tableName: 'pepito'
    }, {
      columnsCollection: new Backbone.Collection(),
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });

    this.columnsCollection = new Backbone.Collection([
      {
        name: 'cartodb_id',
        type: 'number'
      }, {
        name: 'description',
        type: 'string'
      }, {
        name: 'the_geom_webmercator',
        type: 'geometry'
      }, {
        name: 'center',
        type: 'geometry'
      }
    ].map(
      function (model) { return new QueryColumnModel(model, { configModel: configModel }); })
    );

    this.view = new TableHeadView({
      columnsCollection: this.columnsCollection,
      tableViewModel: this.tableViewModel,
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: this.queryGeometryModel,
      canHideColumns: false,
      modals: FactoryModals.createModalService()
    });
  });

  describe('render', function () {
    beforeEach(function () {
      spyOn(this.view, '_renderColumnHead').and.callThrough();
      this.view.render();
    });

    it('should render as many columns as column collection items has, except mercator', function () {
      expect(this.view._renderColumnHead).toHaveBeenCalled();
      expect(this.view._renderColumnHead.calls.count()).toBe(this.columnsCollection.length);
      expect(this.view.$('.Table-headItem').length).toBe(this.columnsCollection.length - 1); // all but the_geom_webmercator
      expect(this.view.$('.js-attribute[value="the_geom_webmercator"]').length).toBe(0);
    });

    it('should render the_geom_webmercator when a custom query is applied', function () {
      spyOn(this.tableViewModel, 'isCustomQueryApplied').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Table-headItem').length).toBe(this.columnsCollection.length);
      expect(this.view.$('.js-attribute[value="the_geom_webmercator"]').length).toBe(1);
    });

    describe('when can hide columns flag is true', function () {
      it('should not render center geometry columns', function () {
        spyOn(this.tableViewModel, 'isCustomQueryApplied').and.returnValue(true);
        this.view = new TableHeadView({
          columnsCollection: this.columnsCollection,
          tableViewModel: this.tableViewModel,
          querySchemaModel: this.querySchemaModel,
          queryGeometryModel: this.queryGeometryModel,
          canHideColumns: true,
          modals: FactoryModals.createModalService()
        });
        this.view.render();
        expect(this.view.$('.Table-headItem').length).toBe(this.columnsCollection.length - 1);
        expect(this.view.$('.js-attribute[value="center"]').length).toBe(0);
      });
    });
  });

  describe('binds', function () {
    beforeEach(function () {
      spyOn(this.view, 'render').and.callThrough();
      spyOn(this.view, '_scrollToLeft');
      spyOn(this.view, '_focusLastHeadItem');
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

      this.columnsCollection.add(new QueryColumnModel({
        name: 'hey',
        type: 'date'
      }, { configModel: this.configModel }));
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

    it('should focus new element input when a new element is added', function () {
      jasmine.clock().install();

      this.columnsCollection.add(new QueryColumnModel({
        name: 'hey',
        type: 'date'
      }, { configModel: this.configModel }));
      // When a new column is added, query schema modal is fetched,
      // then columnsCollection is reseted again.
      this.columnsCollection.trigger('reset');
      jasmine.clock().tick(501);
      expect(this.view._focusLastHeadItem).toHaveBeenCalled();

      this.view._focusLastHeadItem.calls.reset();
      this.columnsCollection.remove(this.columnsCollection.at(2));
      this.columnsCollection.trigger('reset');
      jasmine.clock().tick(501);
      expect(this.view._focusLastHeadItem).not.toHaveBeenCalled();

      jasmine.clock().uninstall();
    });
  });

  describe('._focusLastHeadItem', function () {
    it('should call `_lastHeadItemView.focusInput` if _lastHeadItemView is not null', function () {
      this.view._lastHeadItemView = {
        focusInput: function () { }
      };
      spyOn(this.view._lastHeadItemView, 'focusInput');

      this.view._focusLastHeadItem();
      expect(this.view._lastHeadItemView.focusInput).toHaveBeenCalled();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

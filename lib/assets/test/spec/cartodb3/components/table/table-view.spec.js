var _ = require('underscore');
var Backbone = require('backbone');
var QueryRowsCollection = require('../../../../../javascripts/cartodb3/data/query-rows-collection');
var QueryColumnsCollection = require('../../../../../javascripts/cartodb3/data/query-columns-collection');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../javascripts/cartodb3/data/query-geometry-model');
var TableView = require('../../../../../javascripts/cartodb3/components/table/table-view');

describe('components/table/table-view', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();
    this.configModel.getSqlApiUrl = function () { return ''; };

    this.modals = {
      create: function () {}
    };

    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.queryGeometryModel = new QueryGeometryModel({
      status: 'unfetched'
    }, {
      configModel: {}
    });
    spyOn(QueryGeometryModel.prototype, 'fetch');

    spyOn(QuerySchemaModel.prototype, 'fetch');
    this.querySchemaModel = new QuerySchemaModel({
      status: 'unfetched',
      ready: true
    }, {
      configModel: this.configModel
    });

    spyOn(QueryRowsCollection.prototype, 'fetch');
    this.rowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(QueryColumnsCollection.prototype, 'fetch');
    this.columnsCollection = new QueryColumnsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(TableView.prototype, '_setDisableState').and.callThrough();
    this.view = new TableView({
      modals: this.modals,
      rowsCollection: this.rowsCollection,
      columnsCollection: this.columnsCollection,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel
    });
  });

  it('should create table-view-model', function () {
    expect(this.view._tableViewModel).toBeDefined();
  });

  describe('fetch', function () {
    it('should fetch query-schema-model if it is unfetched', function () {
      expect(QuerySchemaModel.prototype.fetch).toHaveBeenCalled();
    });

    it('should fetch rows data if query-schema-model is already fetched', function () {
      spyOn(TableView.prototype, '_fetchRowsData');
      this.querySchemaModel.set('status', 'fetched');
      var view = new TableView({
        modals: this.modals,
        rowsCollection: this.rowsCollection,
        columnsCollection: this.columnsCollection,
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel
      });
      expect(TableView.prototype._fetchRowsData).toHaveBeenCalled();
      expect(view).toBeDefined();
    });

    it('should not fetch rows data if query-schema-model query modifies the schema', function () {
      spyOn(TableView.prototype, '_fetchRowsData');
      this.querySchemaModel.set({
        status: 'fetched',
        query: 'DELETE FROM whatever WHERE perico="PACO"'
      });
      var view = new TableView({
        modals: this.modals,
        rowsCollection: this.rowsCollection,
        columnsCollection: this.columnsCollection,
        queryGeometryModel: this.queryGeometryModel,
        querySchemaModel: this.querySchemaModel
      });
      expect(TableView.prototype._fetchRowsData).not.toHaveBeenCalled();
      expect(view).toBeDefined();
    });
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render head and body', function () {
      expect(_.size(this.view._subviews)).toBe(2);
    });

    it('should add relative class if table view model has it', function () {
      this.view._tableViewModel.set('relativePositionated', true);
      this.view.render();
      expect(this.view.$('.js-table').hasClass('Table--relative')).toBeTruthy();
    });
  });

  describe('bind', function () {
    it('should reset table view attributes when query has changed', function () {
      this.view._tableViewModel.set({
        page: 3,
        order_by: 'description',
        sort_order: 'desc'
      });
      this.querySchemaModel.set('query', 'SELECT * FROM new_table');
      expect(this.view._tableViewModel.get('page')).toBe(0);
      expect(this.view._tableViewModel.get('order_by')).toBe('');
      expect(this.view._tableViewModel.get('sort_order')).toBe('');
    });

    it('should include sort and order if the query is custom but the change comes from table-view-model', function () {
      this.querySchemaModel.set('query', 'SELECT * FROM new_table', { silent: true });
      this.view._tableViewModel.set({
        page: 3,
        order_by: 'description',
        sort_order: 'desc'
      });
      expect(this.view._tableViewModel.get('page')).toBe(3);
      expect(this.view._tableViewModel.get('order_by')).toBe('description');
      expect(this.view._tableViewModel.get('sort_order')).toBe('desc');
    });

    it('should check disabled state each time query schema model changes', function () {
      this.querySchemaModel.set('status', 'fetched');
      expect(TableView.prototype._setDisableState).toHaveBeenCalled();
      TableView.prototype._setDisableState.calls.reset();
      this.querySchemaModel.set('status', 'fetching');
      expect(TableView.prototype._setDisableState).toHaveBeenCalled();
    });

    it('should fetch query-schema-model if query has changed and it is possible', function () {
      this.querySchemaModel.fetch.calls.reset();
      this.querySchemaModel.set({
        query: 'SELECT * FROM new_table',
        status: 'unfetched'
      });
      expect(this.querySchemaModel.fetch).toHaveBeenCalled();

      this.querySchemaModel.fetch.calls.reset();
      this.querySchemaModel.set({
        query: '',
        status: 'unfetched'
      });
      expect(this.querySchemaModel.fetch).not.toHaveBeenCalled();
    });

    it('should fetch new rows when query fetch has finished', function () {
      this.querySchemaModel.set('status', 'fetched');
      expect(QueryRowsCollection.prototype.fetch).toHaveBeenCalled();
    });

    describe('on table model view changes', function () {
      beforeEach(function () {
        this.querySchemaModel.set('status', 'fetched');
        this.queryGeometryModel.set({
          status: 'fetched'
        });
      });

      it('should fetch new rows when table order changes', function () {
        this.view._tableViewModel.set('order_by', 'cartodb_id');
        expect(QueryRowsCollection.prototype.fetch).toHaveBeenCalled();
      });

      it('should fetch new rows when table sort changes', function () {
        this.view._tableViewModel.set('sort_order', 'desc');
        expect(QueryRowsCollection.prototype.fetch).toHaveBeenCalled();
      });
    });
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

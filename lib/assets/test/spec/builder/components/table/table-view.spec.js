var _ = require('underscore');
var Backbone = require('backbone');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var QueryColumnsCollection = require('builder/data/query-columns-collection');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var TableView = require('builder/components/table/table-view');
var ConfigModel = require('builder/data/config-model');
var FactoryModals = require('../../factories/modals');

describe('components/table/table-view', function () {
  beforeEach(function () {
    spyOn(QueryGeometryModel.prototype, 'fetch');
    spyOn(QueryRowsCollection.prototype, 'fetch');
    spyOn(QueryColumnsCollection.prototype, 'fetch');
    spyOn(QuerySchemaModel.prototype, 'fetch');

    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.configModel = new ConfigModel({
      user_name: 'pepito'
    });

    this.userModel = new UserModel({
      name: 'pepito'
    }, {
      configModel: this.configModel
    });

    this.modals = FactoryModals.createModalService();

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from pepito',
      table_name: 'pepito',
      id: 'dummy-id'
    }, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.querySchemaModel = this.analysisDefinitionNodeModel.querySchemaModel;
    this.queryGeometryModel = this.analysisDefinitionNodeModel.queryGeometryModel;

    this.querySchemaModel.attributes.status = 'unfetched';

    this.columnsCollection = new QueryColumnsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(TableView.prototype, '_setDisableState').and.callThrough();
    spyOn(TableView.prototype, 'render').and.callThrough();

    this.view = new TableView({
      modals: this.modals,
      columnsCollection: this.columnsCollection,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
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
        columnsCollection: this.columnsCollection,
        analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
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
        columnsCollection: this.columnsCollection,
        analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
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

    it('should render again if synchronization is destroyed', function () {
      spyOn(this.analysisDefinitionNodeModel, 'isSourceType').and.returnValue(true);
      var tableModel = this.analysisDefinitionNodeModel.getTableModel();
      tableModel._syncModel = new Backbone.Model({ id: 'dummy' });
      tableModel._syncModel.url = 'dummy';
      tableModel._syncModel.sync = function (a, b, opts) {
        opts.success();
      };
      this.view._tableModel = tableModel;

      this.view._initBinds();
      tableModel._syncModel.destroy();

      expect(TableView.prototype.render).toHaveBeenCalled();
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

  describe('.getColumnsCollection', function () {
    it('should provide the _columnsCollection object', function () {
      expect(this.view.getColumnsCollection()).toBe(this.view._columnsCollection);
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

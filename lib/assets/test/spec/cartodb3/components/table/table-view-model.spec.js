var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');
var TableViewModel = require('../../../../../javascripts/cartodb3/components/table/table-view-model');

describe('components/table/table-view-model', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();
    this.configModel.getSqlApiUrl = function () { return ''; };

    spyOn(QuerySchemaModel.prototype, 'fetch').and.callThrough();
    this.querySchemaModel = new QuerySchemaModel({
      status: 'unfetched',
      query: 'SELECT * FROM paco'
    }, {
      configModel: this.configModel
    });

    spyOn(TableViewModel.prototype, '_setOrderAndSort').and.callThrough();
    this.model = new TableViewModel({
      readonly: false,
      tableName: 'paco'
    }, {
      querySchemaModel: this.querySchemaModel
    });
  });

  describe('_setOrderAndSort', function () {
    it('should set order and sort when it is initialized', function () {
      expect(TableViewModel.prototype._setOrderAndSort).toHaveBeenCalled();
    });

    it('should set/change order when query-schema-model has changed its status', function () {
      TableViewModel.prototype._setOrderAndSort.calls.reset();
      expect(TableViewModel.prototype._setOrderAndSort.calls.count()).toBe(0);
      this.querySchemaModel.set('status', 'fetched');
      expect(TableViewModel.prototype._setOrderAndSort).toHaveBeenCalled();
      expect(TableViewModel.prototype._setOrderAndSort.calls.count()).toBe(1);
    });

    it('should use cartodb_id as order_by and asc as sort_by if query-schema-model is reseted, it is available and query is not custom', function () {
      var resetQuerySchemaCollumns = function () {
        this.querySchemaModel.parse({
          rows: [],
          fields: {}
        });
      }.bind(this);

      spyOn(this.model, 'isCustomQueryApplied').and.returnValue(false);
      this.model.set('order_by', 'hello');
      resetQuerySchemaCollumns();

      this.querySchemaModel.set('status', 'fetching');
      this.querySchemaModel.parse({
        rows: [],
        fields: {
          cartodb_id: { type: 'number' }
        }
      });
      this.querySchemaModel.set('status', 'fetched');
      expect(this.model.get('order_by')).toBe('cartodb_id');

      this.model.set('order_by', 'hello');
      resetQuerySchemaCollumns();
      this.querySchemaModel.set('status', 'fetching');
      this.querySchemaModel.parse({
        rows: [],
        fields: {
          available: { type: 'boolean' }
        }
      });
      this.querySchemaModel.set('status', 'fetched');
      expect(this.model.get('order_by')).not.toBe('cartodb_id');
    });

    it('should not use cartodb_id as order_by and asc as sort_by if query-schema-model is reseted, it is available and query is custom', function () {
      spyOn(this.model, 'isCustomQueryApplied').and.returnValue(true);
      this.model.set('order_by', 'hello');

      this.querySchemaModel.set('status', 'fetching');
      this.querySchemaModel.parse({
        rows: [],
        fields: {
          cartodb_id: { type: 'number' }
        }
      });
      this.querySchemaModel.set('status', 'fetched');
      expect(this.model.get('order_by')).not.toBe('cartodb_id');
    });
  });

  describe('isDisabled', function () {
    it('should be disabled if readonly is true', function () {
      this.model.set({
        readonly: true
      });
      expect(this.model.isDisabled()).toBeTruthy();
      this.model.set({
        readonly: false
      });
      expect(this.model.isDisabled()).toBeFalsy();
    });

    it('should be disabled if there is no table name defined', function () {
      this.model.set({
        readonly: false,
        tableName: ''
      });
      expect(this.model.isDisabled()).toBeTruthy();
      this.model.set({
        tableName: 'paco'
      });
      expect(this.model.isDisabled()).toBeFalsy();
    });

    it('should be disabled if query is custom', function () {
      this.model.set({
        readonly: false,
        tableName: 'paco'
      });
      this.querySchemaModel.set('query', 'select * from paco limit 10');

      expect(this.model.isDisabled()).toBeTruthy();

      this.querySchemaModel.set('query', 'select * from paco');
      expect(this.model.isDisabled()).toBeFalsy();
    });
  });

  describe('isCustomQueryApplied', function () {
    it('should say so if query is not the common one', function () {
      this.querySchemaModel.set('query', 'select * from paco');
      expect(this.model.isCustomQueryApplied()).toBeFalsy();
      this.querySchemaModel.set('query', 'select * from paco where cartodb_id=2');
      expect(this.model.isCustomQueryApplied()).toBeTruthy();
      this.querySchemaModel.set('query', 'select * from hey');
      expect(this.model.isCustomQueryApplied()).toBeTruthy();
      this.querySchemaModel.set('query', 'SELECT * FROM paco');
      expect(this.model.isCustomQueryApplied()).toBeFalsy();
    });

    it('should not consider custom query if table name is from another org user', function () {
      this.querySchemaModel.set('query', 'select * from hey.hello');
      this.model.set('tableName', '"hey".hello');
      expect(this.model.isCustomQueryApplied()).toBeFalsy();
      this.querySchemaModel.set('query', 'select * from "hey".hello');
      this.model.set('tableName', 'hey.hello');
      expect(this.model.isCustomQueryApplied()).toBeFalsy();
    });
  });
});

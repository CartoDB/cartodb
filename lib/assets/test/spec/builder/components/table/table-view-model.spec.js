var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var TableViewModel = require('builder/components/table/table-view-model');

describe('components/table/table-view-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel();
    this.userModel = new UserModel({
      name: 'pepito'
    }, {
      configModel: this.configModel
    });

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from pepito',
      table_name: 'pepito',
      id: 'dummy-id'
    }, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.columnsCollection = new Backbone.Collection();

    spyOn(TableViewModel.prototype, '_setOrderAndSort').and.callThrough();

    this.model = new TableViewModel({}, {
      columnsCollection: this.columnsCollection,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });
  });

  describe('_setOrderAndSort', function () {
    it('should set order and sort when it is initialized', function () {
      expect(TableViewModel.prototype._setOrderAndSort).toHaveBeenCalled();
    });

    it('should set/change order when columnsCollection is reseted', function () {
      TableViewModel.prototype._setOrderAndSort.calls.reset();
      expect(TableViewModel.prototype._setOrderAndSort.calls.count()).toBe(0);
      this.columnsCollection.reset([]);
      expect(TableViewModel.prototype._setOrderAndSort).toHaveBeenCalled();
      expect(TableViewModel.prototype._setOrderAndSort.calls.count()).toBe(1);
    });

    it('should use cartodb_id as order_by and asc as sort_by if columnsCollection is reseted, and query is not custom', function () {
      spyOn(this.model, 'isCustomQueryApplied').and.returnValue(false);
      this.model.set('order_by', 'hello');
      this.columnsCollection.reset([{
        name: 'cartodb_id',
        type: 'number'
      }]);
      expect(this.model.get('order_by')).toBe('cartodb_id');
    });

    it('should not use cartodb_id as order_by and asc as sort_by if columnsCollection is reseted, it is available and query is custom', function () {
      spyOn(this.model, 'isCustomQueryApplied').and.returnValue(true);
      this.model.set('order_by', 'hello');
      this.columnsCollection.reset([{
        name: 'cartodb_id',
        type: 'number'
      }]);
      expect(this.model.get('order_by')).not.toBe('cartodb_id');
    });
  });

  describe('isDisabled', function () {
    it('should return that if analysisDefinitionNodeModel says so', function () {
      spyOn(this.analysisDefinitionNodeModel, 'isReadOnly').and.returnValue(false);
      expect(this.model.isDisabled()).toBeFalsy();
      this.analysisDefinitionNodeModel.isReadOnly.and.returnValue(true);
      expect(this.model.isDisabled()).toBeTruthy();
    });
  });

  describe('isCustomQueryApplied', function () {
    it('should return that if analysisDefinitionNodeModel says so', function () {
      spyOn(this.analysisDefinitionNodeModel, 'isCustomQueryApplied').and.returnValue(false);
      expect(this.model.isCustomQueryApplied()).toBeFalsy();
      this.analysisDefinitionNodeModel.isCustomQueryApplied.and.returnValue(true);
      expect(this.model.isCustomQueryApplied()).toBeTruthy();
    });
  });
});

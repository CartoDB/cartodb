var ConfigModel = require('builder/data/config-model');
var CoreView = require('backbone/core-view');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var TableManager = require('builder/components/table/table-manager');
var FactoryModals = require('../../factories/modals');

describe('components/table/table-manager', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel();
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

    spyOn(this.analysisDefinitionNodeModel.querySchemaModel, 'fetch');
    spyOn(this.analysisDefinitionNodeModel.queryGeometryModel, 'fetch');
  });

  describe('create', function () {
    it('should generate a TableView with columns collection', function () {
      var tableView = TableManager.create({
        modals: this.modals,
        configModel: this.configModel,
        analysisDefinitionNodeModel: this.analysisDefinitionNodeModel,
        userModel: this.userModel
      });

      expect(tableView).toBeDefined();
      expect(tableView._columnsCollection).toBeDefined();
    });
  });

  describe('destroy', function () {
    it('should clean the table view', function () {
      var view = new CoreView();
      spyOn(view, 'clean').and.callThrough();
      TableManager.destroy(view);
      expect(view.clean).toHaveBeenCalled();
    });
  });
});

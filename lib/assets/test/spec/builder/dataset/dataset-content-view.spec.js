var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var DatasetContentView = require('builder/dataset/dataset-content/dataset-content-view');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var FactoryModals = require('../factories/modals');

describe('dataset/dataset-content-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from pepito',
      table_name: 'pepito',
      id: 'dummy-id'
    }, {
      tableData: {
        permission: {
          owner: {
            username: 'pepe'
          }
        },
        synchronization: {}
      },
      configModel: configModel,
      userModel: userModel
    });

    this.querySchemaModel = this.analysisDefinitionNodeModel.querySchemaModel;
    this.queryGeometryModel = this.analysisDefinitionNodeModel.queryGeometryModel;
    this.tableModel = this.analysisDefinitionNodeModel.getTableModel();
    this.syncModel = this.tableModel.getSyncModel();

    spyOn(this.querySchemaModel, 'fetch');
    spyOn(this.queryGeometryModel, 'fetch');
    spyOn(this.tableModel, 'isSync');

    spyOn(DatasetContentView.prototype, 'render').and.callThrough();

    this.view = new DatasetContentView({
      modals: FactoryModals.createModalService(),
      userModel: userModel,
      configModel: configModel,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel,
      visModel: new Backbone.Model({ name: 'hey' })
    }, {
      configModel: this._configModel
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render the table view', function () {
      this.tableModel.isSync.and.returnValue(false);
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$('.Table').length).toBe(1);
      expect(this.view.$('.Table').hasClass('Table--relative')).toBeTruthy();
    });

    it('should render the table as disabled if table belongs to other user', function () {
      spyOn(this.tableModel._permissionModel, 'isOwner').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
    });

    it('should render the table as disabled if it is sync', function () {
      this.tableModel.isSync.and.returnValue(true);
      spyOn(this.tableModel._permissionModel, 'isOwner').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(1);
    });

    it('should not render sync info if table doesn\'t belong to the user', function () {
      this.tableModel.isSync.and.returnValue(true);
      spyOn(this.tableModel._permissionModel, 'isOwner').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(0);
    });
  });

  it('should set new table-name in table-view columnsCollection when it changes', function () {
    var columnsCollection = this.view._tableView._columnsCollection;
    spyOn(columnsCollection, 'setTableName');
    this.view._visModel.set('name', 'another');
    expect(columnsCollection.setTableName).toHaveBeenCalledWith('another');
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

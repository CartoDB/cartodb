var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var DatasetContentView = require('../../../../javascripts/cartodb3/dataset/dataset-content/dataset-content-view');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var SyncModel = require('../../../../javascripts/cartodb3/data/synchronization-model');
var QueryGeometryModel = require('../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

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

    this.tableModel = new TableModel({
      name: 'table_1',
      permission: {}
    }, {
      parse: true,
      configModel: configModel
    });

    var permission = {
      owner: {
        username: 'pepe'
      }
    };

    this.tableModel.set('permission', permission);

    var querySchemaModel = new QuerySchemaModel({
      status: 'unfetched',
      query: 'select * from table_1'
    }, {
      configModel: configModel
    });
    spyOn(querySchemaModel, 'fetch');

    var queryGeometryModel = new QueryGeometryModel({
      status: 'unfetched',
      query: 'select * from table_1'
    }, {
      configModel: configModel
    });
    spyOn(queryGeometryModel, 'fetch');

    this.syncModel = new SyncModel({}, { configModel: configModel });
    this.syncModel.sync = function (a, b, opts) {
      opts && opts.success();
    };
    spyOn(this.syncModel, 'isSync');

    spyOn(DatasetContentView.prototype, 'render').and.callThrough();
    this.view = new DatasetContentView({
      modals: new Backbone.Model(),
      userModel: userModel,
      tableModel: this.tableModel,
      syncModel: this.syncModel,
      configModel: configModel,
      queryGeometryModel: queryGeometryModel,
      querySchemaModel: querySchemaModel
    }, {
      configModel: this._configModel
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render the table view', function () {
      this.syncModel.isSync.and.returnValue(false);
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
      this.syncModel.isSync.and.returnValue(true);
      spyOn(this.tableModel._permissionModel, 'isOwner').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(1);
    });

    it('should not render sync info if table doesn\'t belong to the user', function () {
      this.syncModel.isSync.and.returnValue(true);
      spyOn(this.tableModel._permissionModel, 'isOwner').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(0);
    });

    it('should render again when sync is destroyed', function () {
      DatasetContentView.prototype.render.calls.reset();
      this.syncModel.destroy();
      expect(DatasetContentView.prototype.render).toHaveBeenCalled();
    });
  });

  it('should render again when table name changes', function () {
    DatasetContentView.prototype.render.calls.reset();
    this.view._tableModel.set('name', 'another_name');
    expect(DatasetContentView.prototype.render).toHaveBeenCalled();
    expect(DatasetContentView.prototype.render.calls.count()).toBe(1);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

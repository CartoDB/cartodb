var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var DatasetView = require('../../../../javascripts/cartodb3/dataset/dataset-content/dataset-content-view');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

describe('dataset/dataset-view', function () {
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

    var tableModel = new TableModel({
      name: 'table_1'
    }, {
      configModel: configModel
    });

    var querySchemaModel = new QuerySchemaModel({
      status: 'unfetched'
    }, {
      configModel: configModel
    });
    spyOn(querySchemaModel, 'fetch');

    var syncModel = jasmine.createSpyObj('syncModel', ['get', 'set', 'isSync', 'bind', 'off', 'isSyncing', 'canSyncNow']);

    spyOn(DatasetView.prototype, 'render').and.callThrough();
    this.view = new DatasetView({
      modals: new Backbone.Model(),
      userModel: userModel,
      tableModel: tableModel,
      syncModel: syncModel,
      configModel: configModel,
      querySchemaModel: querySchemaModel
    }, {
      configModel: this._configModel
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render the table view', function () {
      this.view._syncModel.isSync.and.returnValue(false);
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$('.Table').length).toBe(1);
      expect(this.view.$('.Table').hasClass('Table--relative')).toBeTruthy();
    });

    it('should render the table as disabled if table belongs to other user', function () {
      spyOn(this.view._tableModel, 'isOwner').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
    });

    it('should render the table as disabled if it is sync', function () {
      this.view._syncModel.isSync.and.returnValue(true);
      spyOn(this.view._tableModel, 'isOwner').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(1);
    });

    it('should not render sync info if table doesn\'t belong to the user', function () {
      this.view._syncModel.isSync.and.returnValue(true);
      spyOn(this.view._tableModel, 'isOwner').and.returnValue(false);
      this.view.render();
      expect(this.view.$('.Table').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.$('.SyncInfo').length).toBe(0);
    });
  });

  it('should render again when table name changes', function () {
    DatasetView.prototype.render.calls.reset();
    this.view._tableModel.set('name', 'another_name');
    expect(DatasetView.prototype.render).toHaveBeenCalled();
    expect(DatasetView.prototype.render.calls.count()).toBe(1);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

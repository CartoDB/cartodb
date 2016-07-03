var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var HeaderView = require('../../../../javascripts/cartodb3/dataset/dataset-header/header-view');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var VisModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');

describe('dataset/header-view', function () {
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
    spyOn(tableModel, 'isOwner').and.returnValue(true);

    var visModel = new VisModel({
      name: 'table_1',
      privacy: 'PUBLIC'
    }, {
      configModel: configModel
    });

    var querySchemaModel = new QuerySchemaModel({
      status: 'unfetched'
    }, {
      configModel: configModel
    });
    spyOn(querySchemaModel, 'fetch');

    var syncModel = new Backbone.Model();
    var router = jasmine.createSpyObj('router', ['navigate']);

    spyOn(HeaderView.prototype, 'render').and.callThrough();
    spyOn(HeaderView.prototype, '_setDocumentTitle');
    this.view = new HeaderView({
      modals: new Backbone.Model(),
      router: router,
      configModel: configModel,
      querySchemaModel: querySchemaModel,
      userModel: userModel,
      tableModel: tableModel,
      visModel: visModel,
      syncModel: syncModel
    }, {
      configModel: this._configModel
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render the inline editor view', function () {
      expect(_.size(this.view._subviews)).toBe(1);
    });

    it('should not render the inline editor view if table is sync', function () {
      this.view._syncModel.id = 'hello-sync';
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(0);
    });

    it('should not render the inline editor view if owner is different', function () {
      this.view._tableModel.isOwner.and.returnValue(false);
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(0);
    });
  });

  describe('binds', function () {
    it('should change table name when vis name changes', function () {
      expect(this.view._tableModel.get('name')).toBe('table_1');
      this.view._visModel.set('name', 'hello_new_table');
      expect(this.view._tableModel.get('name')).toBe('hello_new_table');
    });

    it('should render when privacy or name changes', function () {
      HeaderView.prototype.render.calls.reset();
      this.view._visModel.set('name', 'hello_new_table');
      expect(HeaderView.prototype.render).toHaveBeenCalled();
    });

    it('should set document title when vis name changes', function () {
      HeaderView.prototype._setDocumentTitle.calls.reset();
      this.view._visModel.set('name', 'hello_new_table');
      expect(HeaderView.prototype._setDocumentTitle).toHaveBeenCalled();
    });

    it('should change router url when vis name changes', function () {
      this.view._visModel.set('name', 'hello_new_table');
      expect(this.view._router.navigate).toHaveBeenCalled();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

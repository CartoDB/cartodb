describe('editor/layers/layers-content-view/data/data-view', function () {
  var Backbone = require('backbone');
  var _ = require('underscore');
  var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
  var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
  var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');
  var SQLModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-sql-model');
  var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
  var VisDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/vis-definition-model');
  var Notifier = require('../../../../../../../javascripts/cartodb3/components/notifier/notifier.js');

  // Stubs
  var proxyquire = require('proxyquireify')(require);

  var sqlStub = jasmine.createSpyObj('SQLNotifications', [
    'track',
    'showErrorNotification',
    'removeNotification',
    '_addOrUpdateNotification'
  ]);

  var onboardingLauncherStub = jasmine.createSpyObj('onboardingLauncher', [ 'launch' ]);

  var DatasetBaseView = proxyquire('../../../../../../../javascripts/cartodb3/components/dataset/dataset-base-view', {
    '../../sql-notifications': sqlStub
  });

  var stubs = {
    '../../../../components/onboardings/layers/onboarding-launcher': function () { return onboardingLauncherStub; },
    '../../../../sql-notifications': sqlStub,
    '../../../../components/dataset/dataset-base-view': DatasetBaseView
  };

  // View
  var DataView = proxyquire('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-view', stubs);

  beforeEach(function () {
    jasmine.Ajax.install();

    sqlStub._addOrUpdateNotification.calls.reset();
    sqlStub.showErrorNotification.calls.reset();
    sqlStub.removeNotification.calls.reset();

    this.sqlModel = new SQLModel({
      content: 'SELECT * FROM table'
    });

    this.configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito',
      api_key: 'hello-apikey'
    });

    this.node = new Backbone.Model({
      type: 'source'
    });
    this.node.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });
    this.node.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: this.configModel
    });
    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    this.layerDefinitionModel = new Backbone.Model({
      user_name: 'pepito'
    });
    this.layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return this.node;
    }.bind(this);
    this.layerDefinitionModel.getTableName = function () {
      return 'table';
    };

    this.userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: this.configModel
    });

    this.layerDefinitionModel.sqlModel = this.sqlModel;

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };
    this.userActions = jasmine.createSpyObj('userActions', ['saveAnalysisSourceQuery']);

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: this.configModel
    });

    Notifier.init({
      editorModel: this.editorModel,
      visDefinitionModel: this.visDefinitionModel
    });

    this.view = new DataView({
      layerDefinitionModel: this.layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      editorModel: this.editorModel,
      userModel: this.userModel,
      userActions: this.userActions,
      configModel: this.configModel,
      onboardings: {}
    });

    this.view._SQL.execute = function (query, vars, params) {
      params.success();
    };

    this.view._widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    spyOn(this.view, 'clean');
    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should create internal codemirror model', function () {
    expect(this.view._codemirrorModel).toBeDefined();
  });

  it('should create _onboardingNotification', function () {
    expect(this.view._onboardingNotification).not.toBe(null);
  });

  it('render should call _launchOnboarding', function () {
    spyOn(this.view, '_launchOnboarding');

    this.view.render();

    expect(this.view._launchOnboarding).toHaveBeenCalled();
  });

  describe('bindings', function () {
    it('should set codemirror value when query schema model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');
      this.node.querySchemaModel.set('query_errors', ['Syntax error']);
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should update codemirror if query schema model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');
      this.view._querySchemaModel.set({query: 'SELECT * FROM table LIMIT 10'});
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when undo or redo is applied', function () {
      this.sqlModel.set('content', 'SELECT foo FROM table');
      spyOn(this.view._codemirrorModel, 'set');
      this.sqlModel.undo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
      this.view._codemirrorModel.set.calls.reset();
      this.sqlModel.redo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });
  });

  it('should apply default query and refresh map and dataset view when query alters data', function () {
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*'))
      .andReturn({ status: 200 });

    var originalQuery = 'SELECT * FROM table';
    spyOn(this.editorModel, 'isEditing').and.returnValue(true);
    spyOn(this.node.querySchemaModel, 'resetDueToAlteredData');
    this.view._codemirrorModel.set('content', 'DELETE FROM table WHERE cartodb_id=2');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe(originalQuery);
    expect(this.userActions.saveAnalysisSourceQuery).toHaveBeenCalled();
    expect(this.node.querySchemaModel.get('query_errors').length).toBe(0);
    expect(this.node.querySchemaModel.get('query')).toBe(originalQuery);
    expect(this.node.querySchemaModel.resetDueToAlteredData).toHaveBeenCalled();
  });

  it('should fetch geometry when a new query is applied', function () {
    this.view._codemirrorModel.set('content', 'SELECT * FROM table LIMIT 10');
    spyOn(this.node.queryGeometryModel, 'fetch');
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._parseSQL();
    expect(this.node.queryGeometryModel.hasChanged('simple_geom')).toBeFalsy();
    expect(this.node.queryGeometryModel.get('query')).toBe('SELECT * FROM table LIMIT 10');
    expect(this.node.queryGeometryModel.fetch).toHaveBeenCalled();
  });

  it('should not let run the same query that is applied', function () {
    var originalQuery = 'SELECT * FROM table';
    spyOn(this.node.querySchemaModel, 'fetch');
    this.node.querySchemaModel.set('query', originalQuery);
    this.view._codemirrorModel.set('content', originalQuery);
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
    this.view._codemirrorModel.set('content', originalQuery.toUpperCase());
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not apply an empty query', function () {
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._codemirrorModel.set('content', '');
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not set a query with a ; character at the end', function () {
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._codemirrorModel.set('content', 'select * from whatever;');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe('select * from whatever');
    expect(this.node.querySchemaModel.fetch).toHaveBeenCalled();

    this.view._codemirrorModel.set('content', 'select * from whatever; hello');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe('select * from whatever; hello');
  });

  it('should not throw notification if same query that is applied', function () {
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._sqlModel.set('content', 'SELECT * FROM table');
    this.view._codemirrorModel.set('content', 'SELECT * + FROM table');
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).toHaveBeenCalled();

    this.node.querySchemaModel.set('query', 'SELECT * FROM table');
    this.node.querySchemaModel.set('query_errors', ['Syntax error']);
    this.view._codemirrorModel.set('content', 'SELECT * FROM table');
    this.node.querySchemaModel.set('query_errors', []);
    this.view._parseSQL();

    expect(sqlStub.showErrorNotification).toHaveBeenCalledTimes(1);
    expect(sqlStub.removeNotification).toHaveBeenCalledTimes(1);
    expect(sqlStub._addOrUpdateNotification).toHaveBeenCalledTimes(1);
  });

  describe('_launchOnboarding', function () {
    it('should do nothing if onboarding was skipped', function () {
      this.view._onboardingNotification.setKey('layer-data-onboarding', true);
      onboardingLauncherStub.launch.calls.reset();

      this.view._launchOnboarding();

      expect(onboardingLauncherStub.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if we are on editing mode', function () {
      this.view._onboardingNotification.setKey('layer-data-onboarding', false);
      this.view._editorModel.isEditing = function () { return true; };
      onboardingLauncherStub.launch.calls.reset();

      this.view._launchOnboarding();

      expect(onboardingLauncherStub.launch).not.toHaveBeenCalled();
    });

    it('should launch the onboarding', function () {
      this.view._onboardingNotification.setKey('layer-data-onboarding', false);
      this.view._editorModel.isEditing = function () { return false; };
      onboardingLauncherStub.launch.calls.reset();

      this.view._launchOnboarding();

      expect(onboardingLauncherStub.launch).toHaveBeenCalled();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

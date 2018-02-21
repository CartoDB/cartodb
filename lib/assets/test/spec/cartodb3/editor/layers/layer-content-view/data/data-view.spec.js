var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('cartodb3/data/config-model');
var LayerContentModel = require('cartodb3/data/layer-content-model');
var QuerySchemaModel = require('cartodb3/data/query-schema-model');
var QueryGeometryModel = require('cartodb3/data/query-geometry-model');
var SQLModel = require('cartodb3/editor/layers/layer-content-views/data/data-sql-model');
var UserModel = require('cartodb3/data/user-model');
var VisDefinitionModel = require('cartodb3/data/vis-definition-model');
var Notifier = require('cartodb3/components/notifier/notifier.js');
var DataView = require('cartodb3/editor/layers/layer-content-views/data/data-view');
var SQLNotifications = require('cartodb3/sql-notifications.js');
var UserNotifications = require('cartodb3/data/user-notifications');
var layerOnboardingKey = require('cartodb3/components/onboardings/layers/layer-onboarding-key');
var Toggler = require('cartodb3/components/toggler/toggler-view');
var TabPaneView = require('cartodb3/components/tab-pane/tab-pane-view');

describe('editor/layers/layers-content-view/data/data-view', function () {
  var view;
  var sqlModel;
  var configModel;
  var node;
  var stackLayoutModel;
  var layerDefinitionModel;
  var userModel;
  var editorModel;
  var userActions;
  var visDefinitionModel;
  var isDataEmpty;

  var createViewFn = function (options) {
    sqlModel = new SQLModel({
      content: 'SELECT * FROM table'
    });

    configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito',
      api_key: 'hello-apikey'
    });

    node = new Backbone.Model({
      type: 'source'
    });

    node.getDefaultQuery = function () {
      return 'SELECT * FROM table';
    };

    node.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: configModel
    });

    node.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: configModel
    });

    stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    layerDefinitionModel = new Backbone.Model({
      user_name: 'pepito'
    });

    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return node;
    };

    layerDefinitionModel.getTableName = function () {
      return 'table';
    };

    layerDefinitionModel.canBeGeoreferenced = function () { return false; };
    layerDefinitionModel.toggleVisible = function () {};

    userModel = new UserModel({
      username: 'pepe'
    }, {
      configModel: configModel
    });

    layerDefinitionModel.sqlModel = sqlModel;

    editorModel = new Backbone.Model();
    editorModel.isEditing = function () { return false; };
    editorModel.isDisabled = function () { return false; };

    userActions = jasmine.createSpyObj('userActions', ['saveAnalysisSourceQuery', 'saveLayer']);

    visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    Notifier.init({
      editorModel: editorModel,
      visDefinitionModel: visDefinitionModel
    });

    spyOn(SQLNotifications, 'showErrorNotification');
    spyOn(SQLNotifications, 'removeNotification');
    spyOn(SQLNotifications, '_addOrUpdateNotification');

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });

    var layerContentModel = new LayerContentModel({}, {
      querySchemaModel: new Backbone.Model(),
      queryGeometryModel: new Backbone.Model(),
      queryRowsCollection: new Backbone.Collection()
    });

    isDataEmpty = false;

    var defaultOptions = {
      layerDefinitionModel: layerDefinitionModel,
      stackLayoutModel: stackLayoutModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      editorModel: editorModel,
      userModel: userModel,
      userActions: userActions,
      configModel: configModel,
      onboardings: {},
      onboardingNotification: onboardingNotification,
      isDataEmpty: isDataEmpty,
      layerContentModel: layerContentModel
    };

    view = new DataView(_.extend(defaultOptions, options));

    spyOn(view._SQL, 'execute').and.callFake(function (query, vars, params) {
      params.success();
    });

    spyOn(view._onboardingLauncher, 'launch');

    view._widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    spyOn(view, 'clean');

    return view;
  };

  beforeEach(function () {
    jasmine.Ajax.install();

    view = createViewFn();
  });

  afterEach(function () {
    Notifier.off();
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(_.size(view._subviews)).toBe(1);
    });

    it('render should call _launchOnboarding', function () {
      spyOn(view, '_launchOnboarding');

      view.render();

      expect(view._launchOnboarding).toHaveBeenCalled();
    });

    it('render should call _initViews', function () {
      spyOn(view, '_initViews');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
    });

    it('should not have leaks', function () {
      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  it('should create internal codemirror model', function () {
    view.render();

    expect(view._codemirrorModel).toBeDefined();
  });

  it('should create _onboardingNotification', function () {
    view.render();

    expect(view._onboardingNotification).not.toBe(null);
  });

  describe('._initBinds', function () {
    it('should set codemirror value when query schema model changes', function () {
      spyOn(view._codemirrorModel, 'set');

      view.render();

      node.querySchemaModel.set('query_errors', ['Syntax error']);
      expect(view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should update codemirror if query schema model changes', function () {
      spyOn(view._codemirrorModel, 'set');

      view.render();

      view._querySchemaModel.set({query: 'SELECT * FROM table LIMIT 10'});
      expect(view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when undo or redo is applied', function () {
      view.render();

      sqlModel.set('content', 'SELECT foo FROM table');
      spyOn(view._codemirrorModel, 'set');
      sqlModel.undo();
      expect(view._codemirrorModel.set).toHaveBeenCalled();
      view._codemirrorModel.set.calls.reset();
      sqlModel.redo();
      expect(view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should sync the query status with the apply button status', function () {
      view.render();

      view._querySchemaModel.set('status', 'fetching');
      expect(view._applyButtonStatusModel.get('loading')).toBe(true);

      view._querySchemaModel.set('status', 'fetched');
      expect(view._applyButtonStatusModel.get('loading')).toBe(false);

      view._querySchemaModel.set('status', 'unavailable');
      expect(view._applyButtonStatusModel.get('loading')).toBe(false);

      view._querySchemaModel.set('status', 'unfetched');
      expect(view._applyButtonStatusModel.get('loading')).toBe(false);
    });

    it('should call ._onChangeEdition when _editorModel:edition changes', function () {
      view.render();

      spyOn(view, '_onChangeEdition');

      view._initBinds();
      view._editorModel.trigger('change:edition');

      expect(view._onChangeEdition).toHaveBeenCalled();
    });

    it('should call ._onChangeDisabled when _editorModel:disabled changes', function () {
      spyOn(view, '_onChangeDisabled');

      view.render();

      view._initBinds();
      view._editorModel.trigger('change:disabled');

      expect(view._onChangeDisabled).toHaveBeenCalled();
    });

    it('should call ._onTogglerChanged when _togglerModel:active changes', function () {
      spyOn(view, '_onTogglerChanged');

      view.render();

      view._initBinds();
      view._togglerModel.trigger('change:active');

      expect(view._onTogglerChanged).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should create _infoboxModel', function () {
      view.render();

      view._infoboxModel = undefined;
      expect(view._infoboxModel).not.toBeDefined();

      view._initModels();
      expect(view._infoboxModel).toBeDefined();
    });

    it('should create _overlayModel', function () {
      view.render();

      view._overlayModel = undefined;
      expect(view._overlayModel).not.toBeDefined();

      view._initModels();
      expect(view._overlayModel).toBeDefined();
    });

    it('should create _applyButtonStatusModel', function () {
      view.render();

      view._applyButtonStatusModel = undefined;
      expect(view._applyButtonStatusModel).not.toBeDefined();

      view._initModels();
      expect(view._applyButtonStatusModel).toBeDefined();
    });

    it('should create _togglerModel', function () {
      view.render();

      view._togglerModel = undefined;
      expect(view._togglerModel).not.toBeDefined();

      view._initModels();
      expect(view._togglerModel).toBeDefined();
    });
  });

  it('should apply default query and refresh map and dataset view when query alters data', function () {
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*'))
      .andReturn({ status: 200 });

    var originalQuery = 'SELECT * FROM table';
    spyOn(editorModel, 'isEditing').and.returnValue(true);
    spyOn(node.querySchemaModel, 'resetDueToAlteredData');

    view.render();

    view._codemirrorModel.set('content', 'DELETE FROM table WHERE cartodb_id=2');
    view._parseSQL();
    expect(view._codemirrorModel.get('content')).toBe(originalQuery);
    expect(userActions.saveAnalysisSourceQuery).toHaveBeenCalled();
    expect(node.querySchemaModel.get('query_errors').length).toBe(0);
    expect(node.querySchemaModel.get('query')).toBe(originalQuery);
    expect(node.querySchemaModel.resetDueToAlteredData).toHaveBeenCalled();
  });

  it('should apply error from the SQL api', function () {
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*'))
      .andReturn({status: 429, responseText: '{"error":["You are over platform\'s limits. Please contact us to know more details"]}'});

    spyOn(editorModel, 'isEditing').and.returnValue(true);
    spyOn(node.querySchemaModel, 'resetDueToAlteredData');
    spyOn(node.querySchemaModel, 'canFetch').and.returnValue(true);
    spyOn(view, '_forceErrors');

    view.render();

    view._codemirrorModel.set('content', 'SELECT *, pg_sleep(1) FROM table');
    view._parseSQL();

    expect(userActions.saveAnalysisSourceQuery).not.toHaveBeenCalled();
    expect(node.querySchemaModel.get('query_errors').length).toBe(1);
    expect(view._forceErrors).toHaveBeenCalled();
  });

  it('should fetch geometry when a new query is applied', function () {
    view.render();

    view._codemirrorModel.set('content', 'SELECT * FROM table LIMIT 10');
    spyOn(node.queryGeometryModel, 'fetch');
    spyOn(node.querySchemaModel, 'fetch');
    view._parseSQL();
    expect(node.queryGeometryModel.hasChanged('simple_geom')).toBeFalsy();
    expect(node.queryGeometryModel.get('query')).toBe('SELECT * FROM table LIMIT 10');
    expect(node.queryGeometryModel.fetch).toHaveBeenCalled();
  });

  it('should not let run the same query that is applied', function () {
    var originalQuery = 'SELECT * FROM table';

    spyOn(node.querySchemaModel, 'fetch');

    view.render();

    node.querySchemaModel.set('query', originalQuery);
    view._codemirrorModel.set('content', originalQuery);
    view._parseSQL();
    expect(node.querySchemaModel.fetch).not.toHaveBeenCalled();
    view._codemirrorModel.set('content', originalQuery.toUpperCase());
    view._parseSQL();
    expect(node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not apply an empty query', function () {
    spyOn(node.querySchemaModel, 'fetch');

    view.render();

    view._codemirrorModel.set('content', '');
    view._parseSQL();
    expect(node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not set a query with a ; character at the end', function () {
    spyOn(node.querySchemaModel, 'fetch');

    view.render();

    view._codemirrorModel.set('content', 'select * from whatever;');
    view._parseSQL();

    expect(view._codemirrorModel.get('content')).toBe('select * from whatever');
    expect(node.querySchemaModel.fetch).toHaveBeenCalled();

    view._codemirrorModel.set('content', 'select * from whatever; hello');
    view._parseSQL();
    expect(view._codemirrorModel.get('content')).toBe('select * from whatever; hello');
  });

  it('should not throw notification if same query that is applied', function () {
    SQLNotifications._addOrUpdateNotification.calls.reset();
    spyOn(node.querySchemaModel, 'fetch');

    view.render();

    view._sqlModel.set('content', 'SELECT * FROM table');
    view._codemirrorModel.set('content', 'SELECT * + FROM table');
    view._parseSQL();
    expect(node.querySchemaModel.fetch).toHaveBeenCalled();

    node.querySchemaModel.set('query', 'SELECT * FROM table');
    node.querySchemaModel.set('query_errors', ['Syntax error']);
    view._codemirrorModel.set('content', 'SELECT * FROM table');
    node.querySchemaModel.set('query_errors', []);
    view._parseSQL();

    expect(SQLNotifications.showErrorNotification).toHaveBeenCalledTimes(1);
    expect(SQLNotifications.removeNotification).toHaveBeenCalledTimes(1);
    expect(SQLNotifications._addOrUpdateNotification).toHaveBeenCalledTimes(1);
  });

  describe('_launchOnboarding', function () {
    it('should do nothing if onboarding was skipped', function () {
      view.render();

      view._onboardingNotification.setKey(layerOnboardingKey, true);
      view._onboardingLauncher.launch.calls.reset();

      view._launchOnboarding();

      expect(view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if we are on editing mode', function () {
      view.render();

      view._onboardingNotification.setKey(layerOnboardingKey, false);
      view._editorModel.isEditing = function () { return true; };
      view._onboardingLauncher.launch.calls.reset();

      view._launchOnboarding();

      expect(view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should launch the onboarding', function () {
      view.render();

      view._onboardingNotification.setKey(layerOnboardingKey, false);
      view._editorModel.isEditing = function () { return false; };
      view._onboardingLauncher.launch.calls.reset();

      view._launchOnboarding();

      expect(view._onboardingLauncher.launch).toHaveBeenCalled();
    });
  });

  describe('._infoboxState', function () {
    beforeEach(function () {
      view.render();

      view._infoboxModel.set('state', '');
      view._overlayModel.set('visible', false);
      view._editorModel.set('edition', false);
      view._codemirrorModel.set('readonly', false);
      spyOn(view, '_hasAnalysisApplied').and.returnValue(false);
      spyOn(view, '_isLayerHidden').and.returnValue(false);
    });

    describe('if layer is editing and has analysis', function () {
      it('should set infobox state', function () {
        view._editorModel.set('edition', true);
        view._hasAnalysisApplied.and.returnValue(true);

        view._infoboxState();

        expect(view._infoboxModel.get('state')).toBe('readonly');
        expect(view._codemirrorModel.get('readonly')).toBe(true);
      });
    });

    describe('if layer is hidden', function () {
      it('should set infobox state', function () {
        view._isLayerHidden.and.returnValue(true);

        view._infoboxState();

        expect(view._infoboxModel.get('state')).toBe('layer-hidden');
        expect(view._overlayModel.get('visible')).toBe(true);
      });
    });

    it('should unset infobox state', function () {
      view._infoboxState();

      expect(view._infoboxModel.get('state')).toBe('');
      expect(view._overlayModel.get('visible')).toBe(false);
    });
  });

  describe('._showHiddenLayer', function () {
    it('should show layer if is visible', function () {
      spyOn(view._layerDefinitionModel, 'toggleVisible');

      view.render();
      view._showHiddenLayer();

      expect(view._layerDefinitionModel.toggleVisible).toHaveBeenCalled();
      expect(view._userActions.saveLayer).toHaveBeenCalledWith(view._layerDefinitionModel, { shouldPreserveAutoStyle: true });
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layer is not visible', function () {
      view.render();
      view._layerDefinitionModel.set('visible', false);

      expect(view._isLayerHidden()).toBe(true);
    });
  });

  describe('._createControlView', function () {
    it('should return a Toggler with togglerModel as model', function () {
      var toggler = view._createControlView();

      expect(toggler instanceof Toggler).toBe(true);
      expect(toggler.model).toEqual(view._togglerModel);
    });
  });

  describe('._createActionView', function () {
    it('should return a TabPaneView with ', function () {
      var tabPaneView = view._createActionView();

      expect(tabPaneView instanceof TabPaneView).toBe(true);
      expect(tabPaneView.collection).toEqual(view._collectionPane);
      expect(tabPaneView._createContentKey).toEqual('createActionView');
    });
  });
});

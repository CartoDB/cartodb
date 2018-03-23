var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LayerContentModel = require('builder/data/layer-content-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var SQLModel = require('builder/editor/layers/layer-content-views/data/data-sql-model');
var UserModel = require('builder/data/user-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var Notifier = require('builder/components/notifier/notifier.js');
var DataView = require('builder/editor/layers/layer-content-views/data/data-view');
var SQLNotifications = require('builder/sql-notifications.js');
var UserNotifications = require('builder/data/user-notifications');
var ONBOARDING_KEY = 'layer-data-onboarding';

describe('editor/layers/layers-content-view/data/data-view', function () {
  var canBeGeoreferencedPromise;

  var createViewFn = function (options) {
    options = options || {};

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
    this.node.getDefaultQuery = function () {
      return 'SELECT * FROM table';
    };
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

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };
    this.editorModel.isDisabled = function () { return false; };
    this.userActions = jasmine.createSpyObj('userActions', ['saveAnalysisSourceQuery', 'saveLayer']);

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: this.configModel
    });

    if (!options.canBeGeoreferencedPromise) {
      this.layerDefinitionModel = new Backbone.Model({
        user_name: 'pepito'
      });
      this.layerDefinitionModel.isDataFiltered = function () {
        return Promise.resolve(true);
      };

      this.layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
        return this.node;
      }.bind(this);
      this.layerDefinitionModel.getTableName = function () {
        return 'table';
      };
      this.layerDefinitionModel.canBeGeoreferenced = function () {};
      this.layerDefinitionModel.toggleVisible = function () { };

      this.userModel = new UserModel({
        username: 'pepe'
      }, {
        configModel: this.configModel
      });

      this.layerDefinitionModel.sqlModel = this.sqlModel;

      canBeGeoreferencedPromise = spyOn(this.layerDefinitionModel, 'canBeGeoreferenced');
      canBeGeoreferencedPromise.and.returnValue(Promise.resolve(true));
    }

    Notifier.init({
      editorModel: this.editorModel,
      visDefinitionModel: this.visDefinitionModel
    });

    this.onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: this.configModel
    });

    var querySchemaModel = new Backbone.Model();
    querySchemaModel.hasRepeatedErrors = function () { return false; };

    var queryGeometryModel = new Backbone.Model();
    queryGeometryModel.hasRepeatedErrors = function () { return false; };

    var queryRowsCollection = new Backbone.Collection();
    queryRowsCollection.hasRepeatedErrors = function () { return false; };

    this.layerContentModel = new LayerContentModel({}, {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    });

    return new DataView({
      layerDefinitionModel: this.layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      editorModel: this.editorModel,
      userModel: this.userModel,
      userActions: this.userActions,
      configModel: this.configModel,
      onboardings: {},
      onboardingNotification: this.onboardingNotification,
      layerContentModel: this.layerContentModel
    });
  };

  beforeEach(function () {
    jasmine.Ajax.install();

    spyOn(SQLNotifications, 'showErrorNotification');
    spyOn(SQLNotifications, 'removeNotification');
    spyOn(SQLNotifications, '_addOrUpdateNotification');

    this.view = createViewFn.call(this);

    spyOn(this.view._SQL, 'execute').and.callFake(function (query, vars, params) {
      params.success();
    });

    spyOn(this.view._onboardingLauncher, 'launch');

    this.view._widgetDefinitionsCollection.isThereTimeSeries = function () {
      return false;
    };
    spyOn(this.view, 'clean');
    this.view.render();
  });

  afterEach(function () {
    Notifier.off();
    jasmine.Ajax.uninstall();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1);
    });

    it('render should call _launchOnboarding', function () {
      spyOn(this.view, '_launchOnboarding');

      this.view.render();

      expect(this.view._launchOnboarding).toHaveBeenCalled();
    });

    it('render should call _initViews', function () {
      spyOn(this.view, '_initViews');

      this.view.render();

      expect(this.view._initViews).toHaveBeenCalled();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  it('should create internal codemirror model', function () {
    expect(this.view._codemirrorModel).toBeDefined();
  });

  it('should create _onboardingNotification', function () {
    expect(this.view._onboardingNotification).not.toBe(null);
  });

  describe('._initBinds', function () {
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

    it('should sync the query status with the apply button status', function () {
      this.view._querySchemaModel.set('status', 'fetching');
      expect(this.view._applyButtonStatusModel.get('loading')).toBe(true);

      this.view._querySchemaModel.set('status', 'fetched');
      expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);

      this.view._querySchemaModel.set('status', 'unavailable');
      expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);

      this.view._querySchemaModel.set('status', 'unfetched');
      expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);
    });

    it('should call ._onChangeEdition when _editorModel:edition changes', function () {
      spyOn(this.view, '_onChangeEdition');

      this.view._initBinds();
      this.view._editorModel.trigger('change:edition');

      expect(this.view._onChangeEdition).toHaveBeenCalled();
    });

    it('should call ._onChangeDisabled when _editorModel:disabled changes', function () {
      spyOn(this.view, '_onChangeDisabled');

      this.view._initBinds();
      this.view._editorModel.trigger('change:disabled');

      expect(this.view._onChangeDisabled).toHaveBeenCalled();
    });

    it('should call ._onTogglerChanged when _togglerModel:active changes', function () {
      spyOn(this.view, '_onTogglerChanged');

      this.view._initBinds();
      this.view._togglerModel.trigger('change:active');

      expect(this.view._onTogglerChanged).toHaveBeenCalled();
    });
  });

  describe('._initModels', function () {
    it('should create _infoboxModel', function () {
      this.view._infoboxModel = undefined;
      expect(this.view._infoboxModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._infoboxModel).toBeDefined();
    });

    it('should change the _infoboxModel state to georeference if can be georeferenced', function (done) {
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);

      this.view = createViewFn.call(this);

      setTimeout(function () {
        expect(this.view._infoboxModel.get('state')).toEqual('georeference');
        done();
      }.bind(this), 0);
    });

    it('should change the _infoboxModel state to empty if it can not be georeferenced', function (done) {
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);
      canBeGeoreferencedPromise.and.returnValue(Promise.resolve(false));

      this.view = createViewFn.call(this, { canBeGeoreferencedPromise: true });

      setTimeout(function () {
        expect(this.view._infoboxModel.get('state')).not.toEqual('georeference');
        done();
      }.bind(this), 0);
    });

    it('should change the _infoboxModel to georeference if the layer is not hidden', function (done) {
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);

      this.view = createViewFn.call(this);

      setTimeout(function () {
        expect(this.view._infoboxModel.get('state')).toEqual('georeference');
        done();
      }.bind(this), 0);
    });

    it('should not the _infoboxModel state to georeference if the layer is hidden', function (done) {
      spyOn(this.view, '_isLayerHidden').and.returnValue(true);
      canBeGeoreferencedPromise.and.returnValue(Promise.resolve(false));

      this.view = createViewFn.call(this, { canBeGeoreferencedPromise: true });

      setTimeout(function () {
        expect(this.view._infoboxModel.get('state')).not.toEqual('georeference');
        done();
      }.bind(this), 0);
    });

    it('should create _overlayModel', function () {
      this.view._overlayModel = undefined;
      expect(this.view._overlayModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._overlayModel).toBeDefined();
    });

    it('should create _applyButtonStatusModel', function () {
      this.view._applyButtonStatusModel = undefined;
      expect(this.view._applyButtonStatusModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._applyButtonStatusModel).toBeDefined();
    });

    it('should create _togglerModel', function () {
      this.view._togglerModel = undefined;
      expect(this.view._togglerModel).not.toBeDefined();

      this.view._initModels();
      expect(this.view._togglerModel).toBeDefined();
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

  it('should apply error from the SQL api', function () {
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*'))
      .andReturn({status: 429, responseText: '{"error":["You are over platform\'s limits. Please contact us to know more details"]}'});

    spyOn(this.editorModel, 'isEditing').and.returnValue(true);
    spyOn(this.node.querySchemaModel, 'resetDueToAlteredData');
    spyOn(this.node.querySchemaModel, 'canFetch').and.returnValue(true);
    spyOn(this.view, '_forceErrors');
    this.view._codemirrorModel.set('content', 'SELECT *, pg_sleep(1) FROM table');
    this.view._parseSQL();

    expect(this.userActions.saveAnalysisSourceQuery).not.toHaveBeenCalled();
    expect(this.node.querySchemaModel.get('query_errors').length).toBe(1);
    expect(this.view._forceErrors).toHaveBeenCalled();
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
    SQLNotifications._addOrUpdateNotification.calls.reset();
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

    expect(SQLNotifications.showErrorNotification).toHaveBeenCalledTimes(1);
    expect(SQLNotifications.removeNotification).toHaveBeenCalledTimes(1);
    expect(SQLNotifications._addOrUpdateNotification).toHaveBeenCalledTimes(1);
  });

  describe('_launchOnboarding', function () {
    it('should do nothing if onboarding was skipped', function () {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, true);
      this.view._onboardingLauncher.launch.calls.reset();

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if we are on editing mode', function () {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
      this.view._editorModel.isEditing = function () { return true; };
      this.view._onboardingLauncher.launch.calls.reset();

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should launch the onboarding', function () {
      this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
      this.view._editorModel.isEditing = function () { return false; };
      this.view._onboardingLauncher.launch.calls.reset();

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
    });
  });

  describe('._infoboxState', function () {
    beforeEach(function () {
      this.view._infoboxModel.set('state', '');
      this.view._overlayModel.set('visible', false);
      this.view._editorModel.set('edition', false);
      this.view._codemirrorModel.set('readonly', false);
      spyOn(this.view, '_hasAnalysisApplied').and.returnValue(false);
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);
    });

    describe('if layer is editing and has analysis', function () {
      it('should set infobox state', function () {
        this.view._editorModel.set('edition', true);
        this.view._hasAnalysisApplied.and.returnValue(true);

        this.view._infoboxState();

        expect(this.view._infoboxModel.get('state')).toBe('readonly');
        expect(this.view._codemirrorModel.get('readonly')).toBe(true);
      });
    });

    describe('if layer is hidden', function () {
      it('should set infobox state', function () {
        this.view._isLayerHidden.and.returnValue(true);

        this.view._infoboxState();

        expect(this.view._infoboxModel.get('state')).toBe('layer-hidden');
        expect(this.view._overlayModel.get('visible')).toBe(true);
      });
    });

    it('should unset infobox state', function () {
      this.view._infoboxState();

      expect(this.view._infoboxModel.get('state')).toBe('');
      expect(this.view._overlayModel.get('visible')).toBe(false);
    });
  });

  describe('._showHiddenLayer', function () {
    it('should show layer if is visible', function () {
      spyOn(this.view._layerDefinitionModel, 'toggleVisible');

      this.view._showHiddenLayer();

      expect(this.view._layerDefinitionModel.toggleVisible).toHaveBeenCalled();
      expect(this.view._userActions.saveLayer).toHaveBeenCalledWith(this.view._layerDefinitionModel, { shouldPreserveAutoStyle: true });
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layer is not visible', function () {
      this.view._layerDefinitionModel.set('visible', false);

      expect(this.view._isLayerHidden()).toBe(true);
    });
  });
});

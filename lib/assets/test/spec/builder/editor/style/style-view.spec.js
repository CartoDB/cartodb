var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var StyleModel = require('builder/editor/style/style-definition-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var CartoCSSModel = require('builder/editor/style/style-cartocss-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var LayerContentModel = require('builder/data/layer-content-model');
var StyleView = require('builder/editor/style/style-view');
var UserActions = require('builder/data/user-actions');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var UserNotifications = require('builder/data/user-notifications');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var UserModel = require('builder/data/user-model');
var QueryRowsCollection = require('builder/data/query-rows-collection');
var FactoryModals = require('../../factories/modals');
var fakePromise = require('fixtures/builder/fake-promise.fixture.js');

var ONBOARDING_KEY = 'layer-style-onboarding';

describe('editor/style/style-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({ status: 200 });

    this.configModel = new ConfigModel({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });
    spyOn(this.userModel, 'featureEnabled').and.returnValue(true);

    this.styleModel = new StyleModel({}, { parse: true });
    this.cartocssModel = new CartoCSSModel();

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    });
    spyOn(this.a0, 'isCustomQueryApplied').and.returnValue(false);

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'abc-123',
      kind: 'carto',
      options: {
        type: 'CartoDB',
        color: '#FABADA',
        table_name: 'foo',
        query: 'SELECT * FROM foo',
        tile_style: 'asdasd',
        visible: true
      }
    }, {
      parse: true,
      configModel: this.configModel,
      collection: this.layerDefinitionsCollection
    });
    this.layerDefinitionModel.styleModel = this.styleModel;
    this.layerDefinitionModel.cartocssModel = this.cartocssModel;

    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);
    spyOn(this.layerDefinitionModel, 'getTableName').and.returnValue('table');

    spyOn(MetricsTracker, 'track');

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });
    this.queryGeometryModel.set('simple_geom', 'point');

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };
    this.editorModel.isDisabled = function () { return false; };

    this.modals = FactoryModals.createModalService();

    this.userActions = UserActions({
      userModel: this.userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });

    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveLayer').and.returnValue(this.promise);
    spyOn(StyleView.prototype, '_infoboxState').and.callThrough();

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: this.configModel
    });

    this.queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
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

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      queryRowsCollection: this.a0.queryRowsCollection,
      modals: this.modals,
      editorModel: this.editorModel,
      userActions: this.userActions,
      configModel: this.configModel,
      userModel: this.userModel,
      onboardings: {},
      onboardingNotification: onboardingNotification,
      layerContentModel: this.layerContentModel
    });

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();

    var dialogs = document.querySelectorAll('body > [data-dialog]');
    [].slice.call(dialogs).forEach(function (childNode) {
      document.body.removeChild(childNode);
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1);
    });
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

  it('should show infobox if layer is hidden', function () {
    this.layerDefinitionModel.set('visible', false);

    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('.Infobox').html()).toContain('editor.messages.layer-hidden');

    this.view._codemirrorModel.set('content', 'foo');
    this.editorModel.set('edition', true);

    // Infobox is also visible in forms
    expect(this.view.$('.Infobox').length).toBe(1);

    this.editorModel.set('edition', false);
    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('.Infobox').html()).toContain('editor.messages.layer-hidden');

    this.layerDefinitionModel.set('visible', true);
    expect(this.view.$('.Infobox').length).toBe(0);
    expect(this.view.$('.Infobox').html()).not.toContain('editor.messages.layer-hidden');
  });

  it('should append existing Maps API errors to codemirror model when view is initialized', function () {
    this.layerDefinitionModel.set('error', {
      type: 'layer',
      subtype: 'turbo-carto',
      line: 99,
      message: 'something went wrong'
    }); // setting this silently

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      queryRowsCollection: this.queryRowsCollection,
      modals: this.modals,
      editorModel: this.editorModel,
      userActions: this.userActions,
      configModel: {},
      userModel: {
        featureEnabled: function () { return true; }
      },
      onboardings: {},
      onboardingNotification: {},
      layerContentModel: this.layerContentModel
    });

    expect(this.view._codemirrorModel.get('errors')).toEqual([{
      line: 99,
      message: 'something went wrong'
    }]);
  });

  describe('.initBinds', function () {
    it('should call ._appendMapsAPIError when layerDefinitionModel:error changes', function () {
      spyOn(this.view, '_appendMapsAPIError');

      this.view._initBinds();
      this.view._layerDefinitionModel.trigger('change:error');

      expect(this.view._appendMapsAPIError).toHaveBeenCalled();
    });

    it('should call ._onCartocssChanged when layerDefinitionModel:cartocss changes', function () {
      spyOn(this.view, '_onCartocssChanged');

      this.view._initBinds();
      this.view._layerDefinitionModel.trigger('change:cartocss');

      expect(this.view._onCartocssChanged).toHaveBeenCalled();
    });

    it('should call ._infoboxState when layerDefinitionModel:visible changes', function () {
      this.view._initBinds();
      this.view._layerDefinitionModel.trigger('change:visible');

      expect(this.view._infoboxState).toHaveBeenCalled();
    });

    it('should call ._infoboxState when layerDefinitionModel:autoStyle changes', function () {
      this.view._initBinds();
      this.view._layerDefinitionModel.set({ autoStyle: 'test' });

      expect(this.view._infoboxState).toHaveBeenCalled();
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

    it('should call ._onUndoRedo when _cartocssModel:undo', function () {
      spyOn(this.view, '_onUndoRedo');

      this.view._initBinds();
      this.view._cartocssModel.trigger('undo');

      expect(this.view._onUndoRedo).toHaveBeenCalled();
    });

    it('should call ._onUndoRedo when _cartocssModel:redo', function () {
      spyOn(this.view, '_onUndoRedo');

      this.view._initBinds();
      this.view._cartocssModel.trigger('redo');

      expect(this.view._onUndoRedo).toHaveBeenCalled();
    });

    it('should call ._updateEditor when _querySchemaModel:redo', function () {
      spyOn(this.view, '_updateEditor');

      this.view._initBinds();
      this.view._querySchemaModel.set({ query_errors: 'Some errors' });

      expect(this.view._updateEditor).toHaveBeenCalled();
    });
  });

  describe('._onUndoRedo', function () {
    it('should set codemirror value when style model changes', function () {
      var newContent = 'some content';
      this.view._cartocssModel.set({ content: newContent }, { silent: true });

      expect(this.view._codemirrorModel.get('content')).not.toEqual(newContent);

      this.view._onUndoRedo();

      expect(this.view._codemirrorModel.get('content')).toEqual(newContent);
    });
  });

  describe('._onCartocssChanged', function () {
    it('should set codemirror value when style model changes', function () {
      var newCartocss = 'some cartocss';
      this.layerDefinitionModel.set({ cartocss: newCartocss }, { silent: true });

      expect(this.view._codemirrorModel.get('content')).not.toEqual(newCartocss);

      this.view._onCartocssChanged();

      expect(this.view._codemirrorModel.get('content')).toEqual(newCartocss);
    });
  });

  describe('._appendMapsAPIError', function () {
    it('should append Maps API errors to existing codemirror errors', function () {
      this.view._codemirrorModel.set('errors', [
        { line: 0, message: 'error 1' }
      ]);

      this.layerDefinitionModel.set('error', {
        type: 'layer',
        subtype: 'turbo-carto',
        line: 1,
        message: 'error 2'
      });

      expect(this.view._codemirrorModel.get('errors')).toEqual([
        { line: 0, message: 'error 1' },
        { line: 1, message: 'error 2' }
      ]);
    });
  });

  it('should save cartocss', function () {
    var content = '#layer {marker-fill:red}';
    spyOn(this.layerDefinitionModel, 'save');
    this.view._codemirrorModel.set('content', content);

    this.view._saveCartoCSS(this.view._onSaveComplete);
    expect(this.view._cartocssModel.get('content')).toBe(content);
    expect(this.layerDefinitionModel.get('autoStyle')).toBeFalsy();
    expect(this.layerDefinitionModel.save).toHaveBeenCalledWith({
      cartocss_custom: true,
      cartocss: content
    }, { complete: this.view._onSaveComplete });
  });

  it('should set loading to false when save is complete', function () {
    this.view._applyButtonStatusModel.set('loading', true);

    this.view._onSaveComplete();

    expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);
  });

  it('should not save cartocss if content is empty', function () {
    var content = '';
    spyOn(this.layerDefinitionModel, 'save');
    this.view._codemirrorModel.set('content', '');
    this.view._saveCartoCSS();
    expect(this.layerDefinitionModel.get('cartocss_custom')).toBeFalsy();
    expect(this.layerDefinitionModel.get('cartocss')).not.toBe(content);
    expect(this.layerDefinitionModel.save).not.toHaveBeenCalled();
  });

  it('should set loading to false when cartoCSS validation fails', function () {
    spyOn(this.layerDefinitionModel, 'save');
    this.view._codemirrorModel.set('content', '#layer {');
    this.view._saveCartoCSS();
    expect(this.layerDefinitionModel.save).not.toHaveBeenCalled();
    expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);
  });

  describe('._launchOnboarding', function () {
    var georeferencePromise = null;
    var hasGeomPromise = null;

    beforeEach(function () {
      georeferencePromise = fakePromise(this.view._layerDefinitionModel, 'canBeGeoreferenced');
      hasGeomPromise = fakePromise(this.view._queryGeometryModel, 'hasValueAsync');
      spyOn(this.view._onboardingLauncher, 'launch');
    });

    describe('when queryRowsCollection is fetched', function () {
      beforeEach(function () {
        spyOn(this.view._queryRowsCollection, 'isFetched').and.returnValue(true);
      });

      it('should do nothing if onboarding was already skipped', function () {
        this.view._onboardingNotification.setKey(ONBOARDING_KEY, true);
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();
        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
      });

      it('should do nothing if it is editing', function (done) {
        this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
        this.view._editorModel.isEditing = function () { return true; };
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();

        georeferencePromise.resolve(false);
        hasGeomPromise.resolve(true);

        setTimeout(function () {
          expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
          done();
        }.bind(this), 0);
      });

      it('should do nothing if it can be georeferenced', function (done) {
        this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();

        georeferencePromise.resolve(true);
        hasGeomPromise.resolve(true);

        setTimeout(function () {
          expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
          done();
        }.bind(this), 0);
      });

      it('should do nothing if it doesn\'t have geometry', function (done) {
        this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
        this.view._editorModel.isEditing = function () { return false; };
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();

        georeferencePromise.resolve(false);
        hasGeomPromise.resolve(false);

        setTimeout(function () {
          expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
          done();
        }.bind(this), 0);
      });

      it('should create and launch onboarding', function (done) {
        this.view._onboardingNotification.setKey(ONBOARDING_KEY, false);
        this.view._editorModel.isEditing = function () { return false; };
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();

        georeferencePromise.resolve(false);
        hasGeomPromise.resolve(true);

        setTimeout(function () {
          expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
          done();
        }.bind(this), 0);
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

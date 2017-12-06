var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var StyleModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QueryGeometryModel = require('../../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../../javascripts/cartodb3/data/query-schema-model');
var CartoCSSModel = require('../../../../../javascripts/cartodb3/editor/style/style-cartocss-model');
var LayerDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StyleView = require('../../../../../javascripts/cartodb3/editor/style/style-view');
var UserActions = require('../../../../../javascripts/cartodb3/data/user-actions');
var MetricsTracker = require('../../../../../javascripts/cartodb3/components/metrics/metrics-tracker');
var UserNotifications = require('../../../../../javascripts/cartodb3/data/user-notifications');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var layerOnboardingKey = require('../../../../../javascripts/cartodb3/components/onboardings/layers/layer-onboarding-key');
var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var QueryRowsCollection = require('../../../../../javascripts/cartodb3/data/query-rows-collection');
var FactoryModals = require('../../factories/modals');

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

    this.view = new StyleView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      queryRowsCollection: this.queryRowsCollection,
      modals: this.modals,
      editorModel: this.editorModel,
      userActions: this.userActions,
      configModel: this.configModel,
      userModel: this.userModel,
      onboardings: {},
      onboardingNotification: onboardingNotification
    });

    spyOn(this.view._onboardingLauncher, 'launch');

    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();

    var dialogs = document.querySelectorAll('body > [data-dialog]');
    [].slice.call(dialogs).forEach(function (childNode) {
      document.body.removeChild(childNode);
    });
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

  it('should show infobox if layer is hidden', function () {
    this.layerDefinitionModel.set('visible', false);

    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('.Infobox').html()).toContain('editor.messages.layer-hidden');

    this.view._codemirrorModel.set('content', 'foo');
    this.editorModel.set('edition', true);

    // Infobox only visible in forms
    expect(this.view.$('.Infobox').length).toBe(0);

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
      onboardingNotification: {}
    });

    expect(this.view._codemirrorModel.get('errors')).toEqual([{
      line: 99,
      message: 'something went wrong'
    }]);
  });

  describe('bindings', function () {
    it('should set codemirror value when style model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');

      this.styleModel.set('type', 'squares');
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when the cartocss is changed', function () {
      spyOn(this.view._codemirrorModel, 'set');

      var css = '#layer { marker-width: 21; marker-fill: #d300ff; }';
      this.layerDefinitionModel.set('cartocss', css);

      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when undo or redo is applied', function () {
      this.styleModel.set('type', 'hexabins');
      spyOn(this.view._codemirrorModel, 'set');

      this.styleModel.undo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();

      this.view._codemirrorModel.set.calls.reset();
      this.styleModel.redo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

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

    it('should set infobox state when autostyle changes', function () {
      this.layerDefinitionModel.set('autoStyle', 'id-id-id');
      expect(StyleView.prototype._infoboxState).toHaveBeenCalled();
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
    describe('when queryRowsCollection is not fetched', function () {
      beforeEach(function () {
        spyOn(this.view._queryRowsCollection, 'isFetched').and.returnValue(false);
        this.view._onboardingLauncher.launch.calls.reset();
        this.view._launchOnboarding();
      });

      it('should wait until it is fetched', function () {
        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
        spyOn(this.view._queryRowsCollection.statusModel, 'unbind').and.callThrough();
        this.view._queryRowsCollection.isFetched.and.returnValue(true);
        this.view._queryRowsCollection.statusModel.set('status', 'fetched');
        expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
        expect(this.view._queryRowsCollection.statusModel.unbind).toHaveBeenCalled();
      });

      // Next steps will be tested in the next describe
    });

    describe('when queryRowsCollection is fetched', function () {
      beforeEach(function () {
        spyOn(this.view._queryRowsCollection, 'isFetched').and.returnValue(true);
      });

      it('should do nothing if onboarding was already skipped', function () {
        this.view._onboardingNotification.setKey(layerOnboardingKey, true);
        this.view._onboardingLauncher.launch.calls.reset();

        this.view._launchOnboarding();

        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
      });

      it('should do nothing if it is editing', function () {
        this.view._onboardingNotification.setKey(layerOnboardingKey, false);
        this.view._editorModel.isEditing = function () { return true; };
        this.view._onboardingLauncher.launch.calls.reset();

        this.view._launchOnboarding();

        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
      });

      it('should do nothing if it can be georeferenced', function () {
        this.view._onboardingNotification.setKey(layerOnboardingKey, false);
        spyOn(this.layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(true);
        this.view._onboardingLauncher.launch.calls.reset();

        this.view._launchOnboarding();

        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
      });

      it('should do nothing if it doesn\'t have geometry', function () {
        this.view._onboardingNotification.setKey(layerOnboardingKey, false);
        this.view._editorModel.isEditing = function () { return false; };
        this.view._onboardingLauncher.launch.calls.reset();
        spyOn(this.layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(true);
        spyOn(this.queryGeometryModel, 'hasValue').and.returnValue(false);

        this.view._launchOnboarding();

        expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
      });

      it('should create and launch onboarding', function () {
        this.view._onboardingNotification.setKey(layerOnboardingKey, false);
        this.view._editorModel.isEditing = function () { return false; };
        spyOn(this.queryGeometryModel, 'hasValue').and.returnValue(true);
        this.view._onboardingLauncher.launch.calls.reset();

        this.view._launchOnboarding();

        expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

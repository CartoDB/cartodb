var Backbone = require('backbone');
var AnalysesView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-view');
var PanelWithOptionsView = require('../../../../../../../javascripts/cartodb3/components/view-options/panel-with-options-view');
var UserNotifications = require('../../../../../../../javascripts/cartodb3/data/user-notifications');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');
var QueryRowsCollection = require('../../../../../../../javascripts/cartodb3/data/query-rows-collection');
var OnboardingsServiceModel = require('../../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
var layerOnboardingKey = require('../../../../../../../javascripts/cartodb3/components/onboardings/layers/layer-onboarding-key');

describe('editor/layers/layer-content-views/analyses/analyses-view', function () {
  var initializeBackup = PanelWithOptionsView.prototype.initialize;
  var renderBackup = PanelWithOptionsView.prototype.render;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: configModel
    });

    this.onboardings = new OnboardingsServiceModel();
    this.onboardings.create = function () {};

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () {
      return false;
    };

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    spyOn(this.querySchemaModel, 'fetch');

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: {}
    });
    spyOn(this.queryGeometryModel, 'fetch');

    this.queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    spyOn(this.queryRowsCollection, 'fetch');

    var layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.canBeGeoreferenced = function () { return false; };
    layerDefinitionModel.toggleVisible = function () { };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return {
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        queryRowsCollection: this.queryRowsCollection
      };
    }.bind(this);

    var analysisDefinitionNodesCollection = new Backbone.Collection();
    analysisDefinitionNodesCollection.isEmpty = function () { return true; };

    var userActions = jasmine.createSpyObj('userActions', ['saveLayer']);

    spyOn(AnalysesView.prototype, '_getQueryAndCheckState').and.callThrough();
    spyOn(AnalysesView.prototype, '_infoboxState').and.callThrough();

    var analysisFormsCollection = new Backbone.Collection();
    analysisFormsCollection.isEmpty = function () {
      return true;
    };

    this.view = new AnalysesView({
      userActions: userActions,
      analysisFormsCollection: analysisFormsCollection,
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      configModel: {},
      userModel: {},
      editorModel: this.editorModel,
      stackLayoutModel: {},
      onboardings: this.onboardings,
      onboardingNotification: onboardingNotification
    });

    PanelWithOptionsView.prototype.initialize = function () { };
    PanelWithOptionsView.prototype.render = function () { return this; };
  });

  afterEach(function () {
    PanelWithOptionsView.prototype.initialize = initializeBackup;
    PanelWithOptionsView.prototype.render = renderBackup;
  });

  describe('initialize', function () {
    it('should create _onboardingNotification', function () {
      expect(this.view._onboardingNotification).not.toBeUndefined();
      expect(this.view._onboardingNotification.get('key')).toBe('builder');
    });
  });

  describe('.render', function () {
    it('should call _launchOnboarding', function () {
      spyOn(this.view, '_launchOnboarding');

      this.view.render();

      expect(this.view._launchOnboarding).toHaveBeenCalled();
    });
  });

  describe('_launchOnboarding', function () {
    it('should do nothing if onboarding was already skipped', function () {
      this.view._onboardingNotification.setKey(layerOnboardingKey, true);
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if there is an analysis', function () {
      this.view._onboardingNotification.setKey(layerOnboardingKey, false);
      this.view._analysisFormsCollection.isEmpty = function () { return false; };
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should create and launch onboarding', function () {
      this.view._onboardingNotification.setKey(layerOnboardingKey, false);
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    it('should check and set infobox state when there is a remove or reset in the analyses form collection', function () {
      this.view._analysisFormsCollection.reset([]);
      expect(AnalysesView.prototype._getQueryAndCheckState).toHaveBeenCalled();

      AnalysesView.prototype._getQueryAndCheckState.calls.reset();
      this.view._analysisFormsCollection.reset([{ id: 'whatever' }], { silent: true });

      this.view._analysisFormsCollection.remove(this.view._analysisFormsCollection.at(0));
      expect(AnalysesView.prototype._getQueryAndCheckState.calls.count()).toBe(1);
    });

    it('should set infobox when layer visibility changes', function () {
      this.view._layerDefinitionModel.set('visible', false);

      expect(AnalysesView.prototype._infoboxState).toHaveBeenCalled();
      expect(this.view._infoboxModel.get('state')).toBe('layer-hidden');
      expect(this.view._overlayModel.get('visible')).toBe(true);
    });
  });

  describe('._infoboxState', function () {
    beforeEach(function () {
      this.view._infoboxModel.set('state', '');
      this.view._overlayModel.set('visible', false);
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(false);
    });

    describe('if layer is hidden', function () {
      it('should set infobox state', function () {
        this.view._isLayerHidden.and.returnValue(true);

        this.view._infoboxState();

        expect(this.view._infoboxModel.get('state')).toBe('layer-hidden');
        expect(this.view._overlayModel.get('visible')).toBe(true);
      });
    });

    it('should set infobox state', function () {
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
      expect(this.view._userActions.saveLayer).toHaveBeenCalledWith(this.view._layerDefinitionModel);
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layer is not visible', function () {
      this.view._layerDefinitionModel.set('visible', false);

      expect(this.view._isLayerHidden()).toBe(true);
    });
  });
});

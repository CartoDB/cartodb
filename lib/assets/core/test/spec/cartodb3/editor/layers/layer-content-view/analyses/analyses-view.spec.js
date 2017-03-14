var Backbone = require('backbone');
var AnalysesView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-view');
var PanelWithOptionsView = require('../../../../../../../javascripts/cartodb3/components/view-options/panel-with-options-view');
var UserNotifications = require('../../../../../../../javascripts/cartodb3/data/user-notifications');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var layerOnboardingKey = require('../../../../../../../javascripts/cartodb3/components/onboardings/layers/layer-onboarding-key');
var AnalysesService = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');

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

    var layerDefinitionModel = new Backbone.Model();
    layerDefinitionModel.canBeGeoreferenced = function () { return false; };
    layerDefinitionModel.toggleVisible = function () { return; };

    var analysisDefinitionNodesCollection = new Backbone.Collection();
    analysisDefinitionNodesCollection.isEmpty = function () { return true; };

    var userActions = jasmine.createSpyObj('userActions', ['saveLayer']);

    this.view = new AnalysesView({
      userActions: userActions,
      analysisFormsCollection: new Backbone.Model({}),
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      configModel: {},
      userModel: {},
      editorModel: new Backbone.Model({}),
      stackLayoutModel: {},
      onboardings: {},
      onboardingNotification: onboardingNotification
    });

    PanelWithOptionsView.prototype.initialize = function () { return; };
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

  describe('._infoboxState', function () {
    beforeEach(function () {
      this.view._infoboxModel.set('state', '');
      this.view._overlayModel.set('visible', false);
      spyOn(this.view, '_isLayerHidden').and.returnValue(false);
      spyOn(this.view._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(false);
    });

    describe('if layer can be georeferenced', function () {
      it('should set infobox state', function () {
        this.view._layerDefinitionModel.canBeGeoreferenced.and.returnValue(true);

        this.view._infoboxState();

        expect(this.view._infoboxModel.get('state')).toBe('georeference');
        expect(this.view._overlayModel.get('visible')).toBe(true);
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

  describe('._onGeoreferenceClicked', function () {
    it('should add Georeference Analysis', function () {
      spyOn(AnalysesService, 'addGeoreferenceAnalysis');

      this.view._onGeoreferenceClicked();

      expect(AnalysesService.addGeoreferenceAnalysis).toHaveBeenCalled();
    });
  });
});

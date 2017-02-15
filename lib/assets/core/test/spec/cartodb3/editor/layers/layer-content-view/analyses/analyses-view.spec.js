var Backbone = require('backbone');
var AnalysesView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-view');
var PanelWithOptionsView = require('../../../../../../../javascripts/cartodb3/components/view-options/panel-with-options-view');

describe('editor/layers/layer-content-views/analyses/analyses-view', function () {
  var initializeBackup = PanelWithOptionsView.prototype.initialize;
  var renderBackup = PanelWithOptionsView.prototype.render;

  beforeEach(function () {
    this.view = new AnalysesView({
      userActions: {},
      analysisFormsCollection: new Backbone.Model({}),
      layerDefinitionModel: new Backbone.Model({}),
      analysisDefinitionNodesCollection: {},
      configModel: {},
      userModel: {},
      editorModel: new Backbone.Model({}),
      stackLayoutModel: {},
      onboardings: {}
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
      this.view._onboardingNotification.setKey('layer-analysis-onboarding', true);
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should do nothing if there is an analysis', function () {
      this.view._onboardingNotification.setKey('layer-analysis-onboarding', false);
      this.view._analysisFormsCollection.isEmpty = function () { return false; };
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).not.toHaveBeenCalled();
    });

    it('should create and launch onboarding', function () {
      this.view._onboardingNotification.setKey('layer-analysis-onboarding', false);
      this.view._analysisFormsCollection.isEmpty = function () { return true; };
      spyOn(this.view._onboardingLauncher, 'launch');

      this.view._launchOnboarding();

      expect(this.view._onboardingLauncher.launch).toHaveBeenCalled();
    });
  });
});

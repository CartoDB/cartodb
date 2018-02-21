var Backbone = require('backbone');
var View = require('builder/components/onboardings/layers/analysis-onboarding/analysis-onboarding-view');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var UserNotifications = require('builder/data/user-notifications');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var helper = require('../../onboarding-tests-helper');

describe('components/onboardings/layers/analysis-onboarding/analysis-onboarding-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.layer = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    var onboardings = new Backbone.Model();
    onboardings.create = function () {};
    onboardings.destroy = function () {};

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      mapId: 'map-123',
      stateDefinitionModel: {}
    });

    this.layerDefinitionsCollection.add(this.layer);

    AnalysesService.init({
      onboardings: onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: {},
      userModel: this.userModel,
      configModel: this.configModel
    });

    var onboardingNotification = new UserNotifications({}, {
      key: 'analysis-key',
      configModel: this.configModel
    });

    this.selector = 'LayerOnboarding';
    this.view = new View({
      onboardingNotification: onboardingNotification,
      editorModel: new Backbone.Model({}),
      notificationKey: 'analysis-key',
      selector: this.selector
    });
  });

  it('should get proper initialization', function () {
    expect(this.view.events()['click .js-add-analysis']).toBe('_onAddAnalysisClicked');
    expect(this.view._numberOfSteps).toBe(0);
    expect(this.view._modifier).toBe('--analysis');
  });

  describe('._onAddAnalysisClicked', function () {
    it('should clean this view and click on global addAnalysis button', function () {
      spyOn(AnalysesService, 'addAnalysis');
      spyOn(this.view, '_forget');

      this.view._onAddAnalysisClicked();

      expect(AnalysesService.addAnalysis).toHaveBeenCalled();
      expect(this.view._forget).toHaveBeenCalled();
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      var editorPanel = helper.addElement('js-editorPanel', 40, 50, 60, 70);
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

      var html = this.view.$el.html();
      expect(this.view.$('.LayerOnboarding-contentWrapper').hasClass('is-step0')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentBody').hasClass('is-step0')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentWrapper').hasClass('js-step')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentBody').hasClass('js-step')).toBe(true);
      expect(html.indexOf('analysis-onboarding.title') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.description') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.description-list.item1') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.description-list.item2') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.description-list.item3') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.description-list.item4') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.done') > -1).toBe(true);
      expect(html.indexOf('analysis-onboarding.add-analysis') > -1).toBe(true);
      expect(helper.assertHighlightPosition(this.view, 'LayerOnboarding', 40, 50, 60, 70)).toBe(true);

      document.body.removeChild(onboardingContainer);
      document.body.removeChild(editorPanel);
    });
  });
});

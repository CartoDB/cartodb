var Backbone = require('backbone');
var View = require('../../../../../../../javascripts/cartodb3/components/onboardings/layers/analysis-onboarding/analysis-onboarding-view');
var AnalysesService = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var UserNotifications = require('../../../../../../../javascripts/cartodb3/data/user-notifications');
var OnboardingsServiceModel = require('../../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');

describe('components/onboardings/layers/analysis-onboarding/analysis-onboarding-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.onboardings = new OnboardingsServiceModel();
    this.widgetDefinitionsCollection = new Backbone.Collection();

    AnalysesService.init({
      onboardings: this.onboardings,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      modals: {},
      userModel: this.userModel,
      configModel: this.configModel
    });

    var onboardingNotification = new UserNotifications({}, {
      key: 'builder',
      configModel: this.configModel
    });

    this.view = new View({
      onboardingNotification: onboardingNotification,
      editorModel: new Backbone.Model({}),
      notificationKey: 'analysis-key'
    });
  });

  it('should get proper initialization', function () {
    expect(this.view.events()['click .js-add-analysis']).toBe('_onAddAnalysisClicked');
    expect(this.view._numberOfSteps).toBe(1);
    expect(this.view._modifier).toBe('--analysis');
  });

  describe('._onAddAnalysisClicked', function () {
    it('should clean this view and click on global addAnalysis button', function () {
      // var addAnalysisClicked = false;
      // $('body').append('<div class="js-add-analysis"></div>');
      // $('.js-add-analysis').on('click', function () {
      //   addAnalysisClicked = true;
      // });
      // spyOn(this.view, 'clean');

      // this.view._onAddAnalysisClicked();

      // expect(this.view.clean).toHaveBeenCalled();
      // expect(addAnalysisClicked).toBe(true);

      // $('.js-add-analysis').remove();
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();

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
    });
  });
});

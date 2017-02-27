var GeoreferenceOnboardingView = require('../../../../../../javascripts/cartodb3/components/onboardings/georeference/georeference-view');
var AnalysesService = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');

var notificationKey = 'georeference';

describe('components/onboardings/georeference/georeference-view', function () {
  beforeEach(function () {
    this.view = new GeoreferenceOnboardingView({
      onboardingNotification: jasmine.createSpyObj('onboardingNotification', ['setKey', 'save']),
      name: 'Untitled 1',
      notificationKey: notificationKey
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should trigger close event', function () {
    var close = false;

    this.view.bind('close', function () {
      close = true;
    }, this);

    this.view.$('.js-close').click();
    expect(close).toBe(true);
  });

  describe('.render', function () {
    it('should render properly', function () {
      var html = this.view.$el.html();

      expect(this.view.$('.LayerOnboarding-contentWrapper').hasClass('is-step0')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentBody').hasClass('is-step0')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentWrapper').hasClass('js-step')).toBe(true);
      expect(this.view.$('.LayerOnboarding-contentBody').hasClass('js-step')).toBe(true);
      expect(html.indexOf('style-onboarding.georeference.title') > -1).toBe(true);
      expect(html.indexOf('style-onboarding.georeference.description') > -1).toBe(true);
      expect(html.indexOf('style-onboarding.georeference.skip') > -1).toBe(true);
      expect(html.indexOf('style-onboarding.georeference.georeference') > -1).toBe(true);
    });
  });

  describe('._checkForgetStatus', function () {
    it('should call forget if check is checked', function () {
      this.view.$('.js-forget').attr('checked', true);

      this.view._checkForgetStatus();

      expect(this.view._onboardingNotification.setKey).toHaveBeenCalledWith(notificationKey, true);
      expect(this.view._onboardingNotification.save).toHaveBeenCalled();
    });
  });

  describe('._onGeoreferenceClicked', function () {
    it('should clean this view and click on global addAnalysis button', function () {
      spyOn(AnalysesService, 'addGeoreferenceAnalysis');
      spyOn(this.view, '_checkForgetStatus');

      this.view._onGeoreferenceClicked();

      expect(AnalysesService.addGeoreferenceAnalysis).toHaveBeenCalled();
      expect(this.view._checkForgetStatus).toHaveBeenCalled();
    });
  });
});

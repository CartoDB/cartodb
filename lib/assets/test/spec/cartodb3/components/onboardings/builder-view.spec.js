var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var BuilderView = require('../../../../../javascripts/cartodb3/components/onboardings/builder/builder-view');
var UserNotifications = require('../../../../../javascripts/cartodb3/data/user-notifications');

describe('components/onboardings/onboarding-view', function () {
  var configModel = new ConfigModel({
    base_url: '/u/pepe'
  });

  beforeEach(function () {
    this.modalModel = new Backbone.Model();
    this.editorModel = new Backbone.Model();
    this._userModel = new Backbone.Model({
      username: 'pepe'
    });

    this._onboardingNotification = new UserNotifications({}, {
      category: 'builder',
      configModel: configModel
    });

    this.view = new BuilderView({
      editorModel: this.editorModel,
      modalModel: this.modalModel,
      userModel: this._userModel,
      onboardingNotification: this._onboardingNotification
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render dialog classes', function () {
    expect(this.view.$el.html()).toContain('BuilderOnboarding');
  });

  it('should trigger close event', function () {
    var close = false;

    this.view.bind('close', function () {
      close = true;
    }, this);

    this.view.$('.js-close').click();
    expect(close).toBe(true);
  });

  it('should allow to navigate between states', function () {
    expect(this.view.model.get('step')).toBe(0);

    this.view.$('.js-start').click();
    expect(this.view.model.get('step')).toBe(1);

    this.view.$('.js-next').click();
    expect(this.view.model.get('step')).toBe(2);

    this.view.$('.js-next').click();
    expect(this.view.model.get('step')).toBe(3);

    this.view.$('.js-next').click();
    expect(this.view.model.get('step')).toBe(4);

    this.view.$('.js-next').click();
    expect(this.view.model.get('step')).toBe(4); // don't go beyond step #4
  });

  it('should responde to edition event', function () {
    this.editorModel.set({edition: true});
    expect(this.view.$el.hasClass('is-editing')).toBe(true);
  });

  it('should store view status', function () {
    this.view.$('.js-forget').click();
    this.view.$('.js-close').click();
    expect(this._onboardingNotification.get('notifications').onboarding).toBe(true);
  });
});

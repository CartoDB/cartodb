var Backbone = require('backbone');
var BuilderView = require('../../../../../javascripts/cartodb3/components/onboardings/builder/builder-view');

fdescribe('components/onboardings/onboarding-view', function () {
  beforeEach(function () {
    this.modalModel = new Backbone.Model();
    this.userModel = new Backbone.Model();
    this.view = new BuilderView({
      modalModel: this.modalModel,
      userModel: this.userModel
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
});

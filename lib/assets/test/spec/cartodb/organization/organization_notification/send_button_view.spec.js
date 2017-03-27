var SendButton = require('../../../../../javascripts/cartodb/organization/organization_notification/send_button_view');

describe('organization/organization_notification/send_button_view', function () {
  beforeEach(function () {
    this.view = new SendButton({
      $form: {}
    });
    spyOn(this.view, '_submit');

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.find('.js-button').text()).toContain('Send');
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });

  describe('.onUpdate', function () {
    it('should show loader after click', function () {
      expect(this.view.model.get('status')).toBe('idle');
      expect(this.view.$el.find('.js-button').text()).not.toContain('Sending');

      this.view.updateCounter(1);
      this.view.$('.js-button').click();

      expect(this.view.model.get('status')).toBe('loading');
      expect(this.view.$el.find('.js-button').text()).toContain('Sending');
      expect(this.view._submit).toHaveBeenCalled();
    });
  });

  describe('.updateCounter', function () {
    it('should not be disabled if length > 0 and length < 140', function () {
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);

      this.view.updateCounter(1);
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(false);
      this.view.$('.js-button').click();
      this.view.$('.js-button').click();
      this.view.$('.js-button').click();
      expect(this.view._submit).toHaveBeenCalledTimes(1);
    });

    it('should be disabled if length == 0 or length > 140 or is loading', function () {
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);

      this.view.updateCounter(0);
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);
      this.view.$('.js-button').click();
      expect(this.view._submit).not.toHaveBeenCalled();

      this.view.updateCounter(141);
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);
      this.view.$('.js-button').click();
      expect(this.view._submit).not.toHaveBeenCalled();
    });

    it('should update counter number', function () {
      expect(this.view.$el.find('.Md-counter').text()).toContain('140');

      this.view.updateCounter(1);

      expect(this.view.$el.find('.Md-counter').text()).toContain('139');
    });

    it('should update counter number color if is disabled', function () {
      expect(this.view.$el.find('.Md-counter').hasClass('Md-counter--negative')).toBe(false);

      this.view.updateCounter(141);

      expect(this.view.$el.find('.Md-counter').hasClass('Md-counter--negative')).toBe(true);
    });
  });
});

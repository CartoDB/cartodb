var SendButton = require('../../../../../javascripts/cartodb/organization/organization_notification/send_button_view');
var $ = require('jquery-cdb-v3');

describe('organization/organization_notification/send_button_view', function () {
  beforeEach(function () {
    this.view = new SendButton({
      $form: $('<form>')
    });

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

  describe('._onUpdate', function () {
    it('should show loader after click', function () {
      expect(this.view.model.get('status')).toBe('idle');
      expect(this.view.$el.find('.js-button').text()).not.toContain('Sending');

      this.view.updateCounter(1);
      this.view.$('.js-button').click();

      expect(this.view.model.get('status')).toBe('loading');
      expect(this.view.$el.find('.js-button').text()).toContain('Sending');
    });
  });

  describe('.updateCounter', function () {
    it('should not be disabled if length > 0 and length < 140', function () {
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);

      this.view.updateCounter(1);

      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(false);
    });

    it('should be disabled if length == 0 or length > 140', function () {
      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);

      this.view.updateCounter(0);

      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);

      this.view.updateCounter(141);

      expect(this.view.$el.find('.js-button').hasClass('is-disabled')).toBe(true);
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

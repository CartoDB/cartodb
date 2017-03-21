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
    it('should re-render and show loader after click', function () {
      expect(this.view.model.get('status')).toBe('idle');
      expect(this.view.$el.find('.js-button').text()).not.toContain('Sending');

      this.view.$('.js-button').click();

      expect(this.view.model.get('status')).toBe('loading');
      expect(this.view.$el.find('.js-button').text()).toContain('Sending');
    });
  });
});

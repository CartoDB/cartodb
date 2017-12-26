var cdb = require('cartodb.js-v3');
var UserNotificationModel = require('../../../../../javascripts/cartodb/common/user_notification/user_notification_model');
var UserNotificationView = require('../../../../../javascripts/cartodb/common/user_notification/user_notification_view');

describe('dashboard/user_notification/user_notification_view', function () {
  beforeEach(function () {
    cdb.config.set('url_prefix', '/u/marieta');

    this._notification = new UserNotificationModel({}, {
      key: 'dashboard',
      configModel: cdb.config
    });

    this.view = new UserNotificationView({
      notification: this._notification
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render template', function () {
    expect(this.view.$el.html()).toContain('onboardingNotification');
  });

  it('should save notification when js-close is clicked', function () {
    this.view.$('.js-close').click();
    expect(this._notification.get('notifications').builder_activated).toBe(true);
  });
});

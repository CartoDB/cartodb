const TrialNotificationView = require('dashboard/components/trial-notification/trial-notification-view');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

const ACCOUNT_URL = 'account_url';
const TRIAL_DAYS = 14;

describe('dashboard/components/trial-notification/trial-notification', function () {
  let view;

  const createViewFn = function () {
    const view = new TrialNotificationView({
      userModel: new UserModelFixture(),
      upgradeUrl: ACCOUNT_URL,
      trialDays: TRIAL_DAYS
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      view.render();

      expect(view.$el.html()).toContain('<a href="' + ACCOUNT_URL + '" class="FlashMessage--text">common.trial_notification.views.trial_notification.add_payment');
      expect(view.$el.html()).toContain('common.trial_notification.views.trial_notification.message');
    });
  });

  it('should not have leaks', function () {
    view.render();

    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});

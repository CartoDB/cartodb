const TrialNotificationView = require('dashboard/components/trial-notification/trial-notification-view');
const UserModelFixture = require('fixtures/dashboard/user-model.fixture');

const ACCOUNT_URL = 'account_url';

describe('dashboard/components/trial-notification/trial-notification', function () {
  let view;

  const createViewFn = function () {
    const view = new TrialNotificationView({
      userModel: new UserModelFixture(),
      accountUpdateUrl: ACCOUNT_URL
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should render properly', function () {
      const HTTP_PROTOCOL = window.location.protocol;

      view.render();

      expect(view.$el.html()).toContain('<a href="' + HTTP_PROTOCOL + '//' + ACCOUNT_URL + '" class="CDB-Button CDB-Button--secondary CDB-Button--secondary--background CDB-Button--big">');
      expect(view.$el.html()).toContain('common.trial_notification.views.trial_notification.message');
      expect(view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">common.trial_notification.views.trial_notification.add_payment</span>');
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

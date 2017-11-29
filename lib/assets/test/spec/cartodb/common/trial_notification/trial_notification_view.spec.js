var TrialNotificationView = require('../../../../../javascripts/cartodb/common/trial_notification/trial_notification_view');

const ACCOUNT_URL = 'account_url';
const PERSONAL_30_ACCOUNT = 'PERSONAL30';

describe('common/trial_notification', function() {
  beforeEach(function () {
    this.view = new TrialNotificationView({
      user: new cdb.admin.User({}),
      accountUpdateUrl: ACCOUNT_URL
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      var HTTP_PROTOCOL = window.location.protocol;

      this.view.render();

      expect(this.view.$el.html()).toContain('<a href="'+ HTTP_PROTOCOL + '//' + ACCOUNT_URL + '" class="CDB-Button CDB-Button--secondary CDB-Button--secondary--background CDB-Button--big">');
      expect(this.view.$el.html()).toContain('common.trial_notification.views.trial_notification.message');
      expect(this.view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">common.trial_notification.views.trial_notification.add_payment</span>');
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

var TrialNotificationView = require('../../../../../javascripts/cartodb/common/trial_notification/trial_notification_view');

const ACCOUNT_URL = 'account_url';
const PERSONAL_30_ACCOUNT = 'PERSONAL30';

describe('common/trial_notification', function() {
  describe('.render', function () {
    it('should render properly', function () {
      var HTTP_PROTOCOL = window.location.protocol;

      this.user = new cdb.admin.User({
        account_type: PERSONAL_30_ACCOUNT
      });

      this.view = new TrialNotificationView({
        user: this.user,
        accountUpdateUrl: ACCOUNT_URL
      });

      this.view.render();

      expect(this.view.$el.html()).toContain('<a href="'+ HTTP_PROTOCOL + '//' + ACCOUNT_URL + '" class="CDB-Button CDB-Button--secondary CDB-Button--secondary--background CDB-Button--big">');
      expect(this.view.$el.html()).toContain('common.trial_notification.views.trial_notification.message');
      expect(this.view.$el.html()).toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">common.trial_notification.views.trial_notification.add_payment</span>');
    });

    it('should be hidden if the account type is not PERSONAL30', function () {
      var HTTP_PROTOCOL = window.location.protocol;

      this.user = new cdb.admin.User({
        account_type: 'OTHER'
      });

      this.view = new TrialNotificationView({
        user: this.user,
        accountUpdateUrl: ACCOUNT_URL
      });

      this.view.render();

      expect(this.view.$el.html()).not.toContain('<a href="'+ HTTP_PROTOCOL + '//' + ACCOUNT_URL + '" class="CDB-Button CDB-Button--secondary CDB-Button--secondary--background CDB-Button--big">');
      expect(this.view.$el.html()).not.toContain('common.trial_notification.views.trial_notification.message');
      expect(this.view.$el.html()).not.toContain('<span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">common.trial_notification.views.trial_notification.add_payment</span>');
    });
  });

  it('should not have leaks', function () {
    this.user = new cdb.admin.User({
      account_type: 'OTHER'
    });

    this.view = new TrialNotificationView({
      user: this.user,
      accountUpdateUrl: ACCOUNT_URL
    });

    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});

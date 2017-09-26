var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ProfileMainView = require('../../../../javascripts/cartodb/profile/profile_main_view');

var CONFIG = {
  trackjs_customer: 'trackjs_customer',
  trackjs_enabled: true,
  trackjs_app_key: 'trackjs_app_key',
  google_analytics_ua: 'UA-20934186-25',
  google_analytics_domain: 'carto.com',
  hubspot_enabled: true,
  hubspot_token: 'yourtoken',
  hubspot_ids: '{}',
  intercom_app_id: 'intercom_app_id'
};

describe('profile/profile_main_view', function () {
  beforeEach(function () {
    this.$el = $(['<div>',
      '<p class="js-logo"></p>',
      '<li class="js-breadcrumb-dropdown"></li>',
      '<a class="js-settings-dropdown" href="#">User settings dropdown</a>',
      '<div class="Header-settingsItemNotifications js-user-notifications"></div>',
      '</div>'].join('\n'));

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'e00000002@d00000002.com',
      account_type: 'FREE',
      db_size_in_bytes: 16384000,
      quota_in_bytes: 1073741824
    });
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    this.view = new ProfileMainView({
      el: this.$el,
      user: this.user,
      config: CONFIG
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {

    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

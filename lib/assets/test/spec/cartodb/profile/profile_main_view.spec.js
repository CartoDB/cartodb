var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ProfileMainView = require('../../../../javascripts/cartodb/profile/profile_main_view');

var CONFIG = {};

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
      account_type: 'FREE'
    });
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    this.view = new ProfileMainView({
      el: this.$el,
      user: this.user,
      config: CONFIG
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();
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

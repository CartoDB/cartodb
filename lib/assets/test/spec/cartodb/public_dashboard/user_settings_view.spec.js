var UserSettingsView = require('../../../../javascripts/cartodb/public_common/user_settings_view');
var cdbAdmin = require('cdb.admin');

describe('public_dashboard/user_settings_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      base_url: 'http://pepe.carto.com',
      username: 'Pepe',
      email: 'pepe@paco.com',
      avatar_url: '//path/to/img.png'
    });

    this.view = new UserSettingsView({
      model: this.user
    });

    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered avatar url', function() {
    expect(this.innerHTML()).toContain('<img src="' + this.user.get('avatar_url') + '"');
  });

  describe('when click .js-dropdown-target', function() {
    beforeEach(function() {
      this.view.$('.js-dropdown-target').click();
    });

    it('should open a dropdown', function() {
      expect(document.body.innerHTML).toContain('Close session');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});

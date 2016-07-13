var SettingsDropdownView = require('../../../../../javascripts/cartodb/public_common/user_settings/dropdown_view');
var cdbAdmin = require('cdb.admin');

describe('public_dashboard/user_settings/dropdown_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      base_url: 'http://pepe.carto.com',
      username: 'Pepe',
      email: 'pepe@paco.com'
    });

    this.view = new SettingsDropdownView({
      model: this.user
    });

    spyOn(this.view, 'hide');

    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered a top block with user meta', function() {
    expect(this.innerHTML()).toContain(this.user.get('username'));
    expect(this.innerHTML()).toContain(this.user.get('email'));
  });

  afterEach(function() {
    this.view.clean();
  });
});

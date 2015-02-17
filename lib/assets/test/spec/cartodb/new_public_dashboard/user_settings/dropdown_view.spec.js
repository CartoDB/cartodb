var SettingsDropdownView = require('new_public_dashboard/user_settings/dropdown_view');
var cdb = require('cartodb.js');
var cdbAdmin = require('cdb.admin');
var UserUrl = require('new_common/urls/user_model');

describe('new_public_dashboard/user_settings/dropdown_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'Pepe',
      email: 'pepe@paco.com'
    });

    this.currentUserUrl = new UserUrl({
      account_host: 'cartodb.com',
      user: this.user
    });

    this.view = new SettingsDropdownView({
      model: this.user,
      currentUserUrl: this.currentUserUrl
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

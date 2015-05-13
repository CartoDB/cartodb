var SettingsDropdownView = require('../../../../../../javascripts/cartodb/common/views/dashboard_header/settings_dropdown_view');
var cdb = require('cartodb.js');
var cdbAdmin = require('cdb.admin');

describe('common/views/dashboard_header/settings_dropdown_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      base_url: 'http://org.cartodb.com/u/pepe',
      username: 'Pepe',
      email: 'pepe@paco.com',
      account_type: 'Coronelli',
      db_size_in_bytes: 311296,
      quota_in_bytes: 1048576
    });

    window.upgrade_url = 'http://localhost:3000/account/development/upgrade';
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
    expect(this.innerHTML()).toContain(this.user.get('account_type').toLowerCase());
  });

  it('should have rendered a block with data usage progress bar', function() {
    expect(this.innerHTML()).toContain('width: 30%');
  });

  it('should have rendered a block with data usage in text', function() {
    expect(this.innerHTML()).toContain('304kB of 1MB');
  });

  it('should have rendered a upgrade link', function() {
    expect(this.innerHTML()).toContain('http://localhost:3000/account/development/upgrade');
  });

  it('should hide when event is triggered on cdb.god model', function() {
    cdb.god.trigger('closeDialogs');
    expect(this.view.hide).toHaveBeenCalled();
  });

  afterEach(function() {
    this.view.clean();
    window.upgrade_url = undefined;
    delete window.upgrade_url;
  });
});

var SettingsDropdownView = require('new_dashboard/header/settings_dropdown_view');
var Backbone = require('backbone');
var cdbAdmin = require('cdb.admin');

describe('new_dashboard/header/settings_dropdown_view', function() {
  describe('given a proper user model', function() {
    beforeEach(function() {
      this.user = new cdbAdmin.User({
        username: 'Pepe',
        email: 'pepe@paco.com',
        account_type: 'Coronelli',
        db_size_in_bytes: 311296,
        quota_in_bytes: 1048576
      });

      this.navigation = new cdbAdmin.Navigation({
        upgrade_url: 'http://localhost:3000/account/development/upgrade'
      });

      this.view = new SettingsDropdownView({
        model: this.user,
        navigation: this.navigation,
        template_base: 'new_dashboard/header/settings_dropdown'
      });
    });

    describe('.render', function() {
      beforeEach(function() {
        this.view.render();
        this.html = this.view.el.innerHTML;
      });

      it('should have no leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });

      it('should have rendered a top block with user meta', function() {
        expect(this.html).toContain(this.user.get('username'));
        expect(this.html).toContain(this.user.get('email'));
        expect(this.html).toContain(this.user.get('account_type'));
      });

      it('should have rendered a block with data usage progress bar', function() {
        expect(this.html).toContain('width: 30%;');
      });

      it('should have rendered a block with data usage in text', function() {
        expect(this.html).toContain('304kB of 1MB');
      });

      it('should have rendered a upgrade link', function() {
        expect(this.html).toContain('http://localhost:3000/account/development/upgrade');
      });

      afterEach(function() {
        this.view.clean();
      });
    });
  });
});

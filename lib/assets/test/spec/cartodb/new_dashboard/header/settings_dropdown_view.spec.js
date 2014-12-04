var SettingsDropdownView = require('new_dashboard/header/settings_dropdown_view');
var Backbone = require('backbone');

describe('new_dashboard/header/settings_dropdown_view', function() {
  describe('given a proper user model', function() {
    beforeEach(function() {
      this.user = new Backbone.Model({
        username: 'Pepe',
        email: 'pepe@paco.com',
        account_type: 'Coronelli',
        db_size_in_bytes: 311296,
        quota_in_bytes: 1048576
      });

      this.view = new SettingsDropdownView({
        model: this.user,
        template_base: 'new_dashboard/header/settings_dropdown'
      });
    });

    describe('.render', function() {
      beforeEach(function() {
        this.view.render();
      });

      it('should have no leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });

      it('should have rendered a top block with user meta', function() {
        var html = this.view.el.innerHTML;
        expect(html).toContain(this.user.get('username'));
        expect(html).toContain(this.user.get('email'));
        expect(html).toContain(this.user.get('account_type'));
      });

      it('should have rendered a block with data usage', function() {
        var html = this.view.el.innerHTML;
        expect(html).toContain('width: 30%;');
        expect(html).toContain('304kB of 1MB');
      });

      afterEach(function() {
        this.view.clean();
      });
    });
  });
});

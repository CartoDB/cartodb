var UserSettingsView = require('../../../../javascripts/cartodb/public_common/user_settings_view');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');

describe('public_dashboard/user_settings_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      base_url: 'http://pepe.cartodb.com',
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

    describe('when clicked again', function() {
      beforeEach(function(done) {
        this.view.$('.js-dropdown-target').click();

        // Unfortunately there's no better way than to check using a recurrent timeout (will abort if jasmine times out)
        // If the expectations above fails something is wrong or has changed…
        var checkIfRemoved;
        (checkIfRemoved = function () { // waits for
         if ($('.Dropdown')[0]) {
           setTimeout(checkIfRemoved, 10);
         } else {
           done();
         }
        })();
      });

      it('should hide dropdown', function() {
        expect(document.body.innerHTML).not.toContain('Close session');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});

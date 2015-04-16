var UserSettingsView = require('../../../../javascripts/cartodb/public_common/user_settings_view');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');

describe('new_public_dashboard/user_settings_view', function() {
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

    it('opens a dropdown', function() {
      expect(document.body.innerHTML).toContain('dropdown');
    });

    describe('when clicked again', function() {
      beforeEach(function(done) {
        this.view.$('.js-dropdown-target').click();

        var checkIfRemoved;
        (checkIfRemoved = function () { // waits for
          if ($('.dropdown').is(':visible')) {
            setTimeout(checkIfRemoved, 10);
          } else {
            done();
          }
        })();
      });

      it('hides dropdown', function() {
        expect($('.dropdown')[0]).toBeUndefined();
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});

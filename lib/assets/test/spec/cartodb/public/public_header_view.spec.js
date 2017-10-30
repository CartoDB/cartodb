var cdb = require('cartodb.js-v3');
var PublicHeaderView = require('../../../../javascripts/cartodb/common/public_header_view');

describe('pubic_map/public_header_view', function() {
  describe('hosted', function () {
    beforeEach(function () {
      this.view = new PublicHeaderView({
        isHosted: true
      });

      this.view.render();
    });

    it('should render', function () {
      expect(this.view.template).toBeDefined();
      expect(this.view.homeUrl).toEqual('/');
      expect(this.view.loginUrl).toEqual('/login');
      expect(this.view.googleEnabled).toEqual(false);
      expect(this.view.$('#header').length).toEqual(1);
      expect(this.view.$('.js-logo').length).toEqual(1);
      expect(this.view.$('.Header-navigationItem').length).toEqual(0);
      expect(this.view.$('.Header-settingsItem').length).toEqual(1);
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('non hosted', function () {
    beforeEach(function () {
      this.view = new PublicHeaderView({
        isHosted: false
      });

      this.view.render();
    });

    it('should render', function () {
      expect(this.view.template).toBeDefined();
      expect(this.view.homeUrl).toEqual('/');
      expect(this.view.loginUrl).toEqual('/login');
      expect(this.view.$('.Header-navigationItem').length).toEqual(5);
      expect(this.view.$('.Header-settingsItem').length).toEqual(2);
      expect($(this.view.$('.Header-settingsItem')[0]).text().trim()).toEqual('Login');
      expect($(this.view.$('.Header-settingsItem')[1]).text().trim()).toEqual('Sign up');
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('Authenticated User', function () {
    beforeEach(function () {
      this.user = new cdb.admin.User({
        username: 'pepe',
        base_url: 'http://pepe.carto.com',
        email: 'pepe@carto.com',
        account_type: 'FREE',
        id: 1,
        api_key: 'hello-apikey'
      });

      this.view = new PublicHeaderView({
        currentUser: this.user,
        isHosted: false
      });

      this.view.render();
    });

    it('should render', function () {
      expect(this.view.template).toBeDefined();
      expect(this.view.loginUrl).toEqual('http://pepe.carto.com');
      expect(this.view.homeUrl).toEqual('http://pepe.carto.com');
      expect(this.view.googleEnabled).toEqual(false);
      expect(this.view.$('.Header-navigationItem').length).toEqual(5);
      expect(this.view.$('.Header-settingsItem').length).toEqual(3);
      expect($(this.view.$('.Header-settingsItem')[0]).text().trim()).toEqual('Maps');
      expect($(this.view.$('.Header-settingsItem')[1]).text().trim()).toEqual('Datasets');
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });
});

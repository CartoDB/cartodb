var UserUrlModel = require('dashboard/data/user-url-model');

describe('dashboard/data/user-url-model', function () {
  beforeEach(function () {
    this.is_org_admin = false;

    this.createUrl = function () {
      this.url = new UserUrlModel({
        base_url: 'http://team.carto.com/u/pepe',
        is_org_admin: this.is_org_admin
      });
    };
  });

  describe('.organization', function () {
    describe('when user is organization admin', function () {
      beforeEach(function () {
        this.is_org_admin = true;
        this.createUrl();
        this.newUrl = this.url.organization();
      });

      it('should return a new url point to the organization settings page', function () {
        expect(this.newUrl).not.toBe(this.url);
        expect(this.newUrl.get('base_url').toString()).toEqual('http://team.carto.com/u/pepe/organization');
      });
    });

    describe('when user is a normal organization member', function () {
      beforeEach(function () {
        this.is_org_admin = false;
        this.createUrl();
        this.newUrl = this.url.organization();
      });

      it('should return a new url point to the organization settings page', function () {
        expect(this.newUrl).not.toBe(this.url);
        expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/account');
      });
    });
  });

  describe('.accountProfile', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.accountProfile();
    });

    it('should return a new url point to the user\'s account profile page', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/profile');
    });
  });

  describe('.accountSettings', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.accountSettings();
    });

    it('should return a new url point to the user\'s account profile page', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/account');
    });
  });

  describe('.publicProfile', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.publicProfile();
    });

    it('should return a new URL pointing to the user\'s public profile home', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toMatch('http://team.carto.com/u/pepe/me');
    });
  });

  describe('.apiKeys', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.apiKeys();
    });

    it('should return a new URL pointing to where the user can find his/her API keys', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toMatch('http://team.carto.com/u/pepe/your_apps');
    });
  });

  describe('.logout', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.logout();
    });

    it('should return a new URL pointing to the logout endpoint', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toMatch('http://team.carto.com/u/pepe/logout');
    });
  });

  describe('.dashboard', function () {
    beforeEach(function () {
      this.createUrl();
      this.newUrl = this.url.dashboard();
    });

    it('should return a new URL pointing to the dashboard of the user', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toMatch('http://team.carto.com/u/pepe/dashboard');
    });
  });
});

var OrganizationUserUrl = require('new_common/urls/organization_user_model');
var UserUrl = require('new_common/urls/organization_user_model');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls/organization_user_model", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      id: 1,
      username: 'pepe',
      organization: {
        name: 'bodega',
        owner: {
          id: '2',
          username: 'baz',
          email: 'baz@bodega.com'
        }
      }
    });

    this.url = new OrganizationUserUrl({
      user: this.user,
      account_host: 'host.ext',
      urls: this.urlsSpy
    });
  });

  describe('.toStr', function() {
    it('should return the URL w/ URL encoding', function() {
      expect(this.url.toStr()).toEqual('http://bodega.host.ext/u/pepe');
    });
  });

  describe('.toAccountSettings', function() {
    describe('given user is also organization admin', function() {
      beforeEach(function() {
        spyOn(this.user, 'isOrgAdmin').and.returnValue(true);
      });

      it('should return URL to manage the organization', function() {
        expect(this.url.toAccountSettings()).toEqual('http://bodega.host.ext/organization');
      });
    });

    describe('given user is not organization admin', function() {
      it('should return URL to edit page of current user', function() {
        expect(this.url.toAccountSettings()).toEqual('http://bodega.host.ext/organization/users/pepe/edit');
      });
    });
  });

  describe('.toUpgradeContactMail', function() {
    describe('given user is also organization admin', function() {
      beforeEach(function() {
        spyOn(this.user, 'isOrgAdmin').and.returnValue(true);
      });

      it('should return the enterprise-support email', function() {
        expect(this.url.toUpgradeContactMail()).toEqual('enterprise-support@cartodb.com');
      });
    });

    describe('given user is not organization admin', function() {
      it('should return org admin email', function() {
        expect(this.url.toUpgradeContactMail()).toEqual('baz@bodega.com');
      });
    });
  });

  describe('.toUpgradeAccount', function() {
    it('should return nothing by default', function() {
      expect(this.url.toUpgradeAccount()).toBeUndefined();
    });

    describe('given there is a upgrade_url set on window object', function() {
      beforeEach(function() {
        window.upgrade_url = 'http://cartodb.com/upgrade';
      });

      it('should return the upgrade URL', function() {
        expect(this.url.toUpgradeAccount()).toEqual(window.upgrade_url);
      });

      afterEach(function() {
        window.upgrade_url = undefined;
        delete window.upgrade_url;
      });
    });
  });

  describe('.toPublicProfile', function() {
    it('should return the URL to the public profile', function() {
      expect(this.url.toPublicProfile()).toEqual('http://bodega.host.ext/u/pepe');
    });
  });

  describe('.toApiKeys', function() {
    it("should return the URL to the user's API keys", function() {
      expect(this.url.toApiKeys()).toEqual('http://bodega.host.ext/your_apps');
    });
  });

  describe('.toLogout', function() {
    it("should return the logout URL", function() {
      expect(this.url.toLogout()).toEqual('http://bodega.host.ext/logout');
    });
  });

  describe('.mapUrl', function() {
    it('should be the same as for UserUrl', function() {
      expect(this.url.mapUrl).toEqual(UserUrl.prototype.mapUrl);
    });
  });
});

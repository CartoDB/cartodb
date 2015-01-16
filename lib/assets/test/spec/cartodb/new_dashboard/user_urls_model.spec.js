var UserUrlsModel = require('new_dashboard/user_urls_model');
var cdbAdmin = require('cdb.admin');

var fakeOrganizationConfig = {
  prefixUrl: function() {
    // Prefix url should have only /u/:username
    return 'https://bodega.cartodb.com/u/pepe';
  }
};

describe("new_dashboard/user_urls_model", function() {
  describe('given an upgrade_url', function() {
    beforeEach(function() {
      this.navigation = new UserUrlsModel({
        upgrade_url: '/my-upgrade'
      }, {});
    });

    it('.upgradeUrl should return the URL where the user can upgrade account', function() {
      expect(this.navigation.upgradeUrl()).toMatch('/my-upgrade');
    });

    it('.hasUpgradeUrl should return true', function() {
      expect(this.navigation.hasUpgradeUrl()).toBeTruthy();
    });
  });

  describe('given no upgrade_url', function() {
    beforeEach(function() {
      this.navigation = new UserUrlsModel({}, {});
    });

    it('.hasUpgradeUrl should return false', function() {
      expect(this.navigation.hasUpgradeUrl()).toBeFalsy();
    });

    it('.hasUpgradeUrl should return false for empty upgrade_url too', function() {
      this.navigation.set('upgrade_url', '');
      expect(this.navigation.hasUpgradeUrl()).toBeFalsy();
    });
  });

  describe('.publicProfileUrl', function() {
    describe('given a user in organization', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User();
        userMock = sinon.mock(this.user);
        userMock.expects('isInsideOrg').returns(true);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('prefixUrl').returns('https://bodega.the-account-host.com');

        this.navigation = new UserUrlsModel({}, {
          config: cdb.config
        });
      });

      it('should return the URL to the public profile within that organisation URL', function() {
        expect(this.navigation.publicProfileUrl(this.user)).toEqual('https://bodega.the-account-host.com/u/pepe');
      });

      afterEach(function() {
        this.cfgMock.restore();
      });
    });

    describe('given a normal user', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isInsideOrg').returns(false);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('get').withArgs('account_host').returns('cartodb.com');

        this.navigation = new UserUrlsModel({}, {
          config: cdb.config
        });
      });

      it('should return the URL to the public profile', function() {
        expect(this.navigation.publicProfileUrl(this.user)).toMatch('//pepe.cartodb.com');
      });

      afterEach(function() {
        this.cfgMock.restore();
      });
    });
  });

  describe('.apiKeysUrl', function() {
    describe('given config is configured for organization', function() {
      beforeEach(function() {
        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it("should return the URL to where the user can find the organization's API keys", function() {
        expect(this.navigation.apiKeysUrl()).toEqual('https://bodega.cartodb.com/your_apps');
      });
    });

    describe('given config is configured for a normal user', function() {
      beforeEach(function() {
        var cfg = jasmine.createSpyObj('cdb.config', ['prefixUrl']);
        cfg.prefixUrl.and.returnValue('');

        this.navigation = new UserUrlsModel({}, {
          config: cfg
        });
      });

      it("should return the URL to where the user can find the organization's API keys", function() {
        expect(this.navigation.apiKeysUrl()).toEqual('/your_apps');
      });
    });
  });

  describe('.accountSettingsUrl', function() {
    describe('given user is organization admin', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(true);

        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it('should return a URL to the organization page', function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toEqual('https://bodega.cartodb.com/organization');
      });
    });

    describe('given user is in organization but not admin', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(true);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it("should return a URL to the user's page within the organization", function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toEqual('https://bodega.cartodb.com/organization/users/pepe/edit');
      });
    });

    describe('given user is not in an organization', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(false);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('get').withArgs('account_host').returns('cartodb.com');

        this.navigation = new UserUrlsModel({}, {
          config: cdb.config
        });
      });

      it("should return a URL to the user settings page", function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toMatch('//cartodb.com/account/pepe');
      });

      afterEach(function() {
        this.cfgMock.restore();
      });
    });
  });

  
  describe('.contactUrl', function() {
    describe('given user is organization admin', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(true);

        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it('should return a enterprise support mail', function() {
        expect(this.navigation.contactUrl(this.user)).toEqual('enterprise-support@cartodb.com');
      });
    });

    describe('given user is in organization but not admin', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        this.user.organization = { owner: new cdbAdmin.User };
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(true);

        ownerMock = sinon.mock(this.user.organization.owner);
        ownerMock.expects('get').withArgs('email').returns('example@cartodb.com');

        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it("should return the organization admin email", function() {
        expect(this.navigation.contactUrl(this.user)).toEqual('example@cartodb.com');
      });
    });

    describe('given user is not in an organization', function() {
      beforeEach(function() {
        this.user = new cdbAdmin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(false);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.navigation = new UserUrlsModel({}, {
          config: cdb.config
        });
      });

      it("should return a default suppport email", function() {
        expect(this.navigation.contactUrl(this.user)).toEqual('support@cartodb.com');
      });
    });
  });



  describe('.logoutUrl', function() {
    describe('given config is configured for organization', function() {
      beforeEach(function() {
        this.navigation = new UserUrlsModel({}, {
          config: fakeOrganizationConfig
        });
      });

      it('should return the logout URL', function() {
        expect(this.navigation.logoutUrl()).toEqual('https://bodega.cartodb.com/logout');
      });
    });

    describe('given config is configured for a normal user', function() {
      beforeEach(function() {
        var cfg = jasmine.createSpyObj('cdb.config', ['prefixUrl']);
        cfg.prefixUrl.and.returnValue('');


        this.navigation = new UserUrlsModel({}, {
          config: cfg
        });
      });

      it('should return the logout URL containing organization part', function() {
        expect(this.navigation.logoutUrl()).toEqual('/logout');
      });
    });
  });
});


var fakeOrganizationConfig = {
  prefixUrl: function() {
    return 'https://bodega.cartodb.com';
  }
};

describe("cdb.admin.Navigation", function() {
  describe('given an upgrade_url', function() {
    beforeEach(function() {
      this.navigation = new cdb.admin.Navigation({
        upgrade_url: '/my-upgrade'
      }, {
        config: cdb.config
      });
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
      this.navigation = new cdb.admin.Navigation({}, {});
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
        this.user = new cdb.admin.User();
        userMock = sinon.mock(this.user);
        userMock.expects('isInsideOrg').returns(true);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('prefixUrl').returns('https://bodega.the-account-host.com');

        this.navigation = new cdb.admin.Navigation({}, {
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
        this.user = new cdb.admin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isInsideOrg').returns(false);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('get').withArgs('account_host').returns('the-account-host.com');

        this.navigation = new cdb.admin.Navigation({}, {
          config: cdb.config
        });
      });

      it('should return the URL to the public profile', function() {
        expect(this.navigation.publicProfileUrl(this.user)).toMatch('//pepe.the-account-host.com');
      });

      afterEach(function() {
        this.cfgMock.restore();
      });
    });
  });

  describe('.apiKeysUrl', function() {
    describe('given config is configured for organization', function() {
      beforeEach(function() {
        this.navigation = new cdb.admin.Navigation({}, {
          config: fakeOrganizationConfig
        });
      });

      it("should return the URL to where the user can find the organization's API keys", function() {
        expect(this.navigation.apiKeysUrl()).toEqual('https://bodega.cartodb.com/your_apps');
      });
    });

    describe('given config is configured for a normal user', function() {
      beforeEach(function() {
        this.navigation = new cdb.admin.Navigation({}, {
          config: cdb.config
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
        this.user = new cdb.admin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(true);

        this.navigation = new cdb.admin.Navigation({}, {
          config: fakeOrganizationConfig
        });
      });

      it('should return a URL to the organization page', function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toEqual('https://bodega.cartodb.com/organization');
      });
    });

    describe('given user is in organization but not admin', function() {
      beforeEach(function() {
        this.user = new cdb.admin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(true);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.navigation = new cdb.admin.Navigation({}, {
          config: fakeOrganizationConfig
        });
      });

      it("should return a URL to the user's page within the organization", function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toEqual('https://bodega.cartodb.com/organization/users/pepe/edit');
      });
    });

    describe('given user is in an organization', function() {
      beforeEach(function() {
        this.user = new cdb.admin.User;
        userMock = sinon.mock(this.user);
        userMock.expects('isOrgAdmin').returns(false);
        userMock.expects('isInsideOrg').returns(false);
        userMock.expects('get').withArgs('username').returns('pepe');

        this.cfgMock = sinon.mock(cdb.config);
        this.cfgMock.expects('get').withArgs('account_host').returns('https://cartodb.com');

        this.navigation = new cdb.admin.Navigation({}, {
          config: cdb.config
        });
      });

      it("should return a URL to the user settings page", function() {
        expect(this.navigation.accountSettingsUrl(this.user)).toMatch('https://cartodb.com/account/pepe');
      });

      afterEach(function() {
        this.cfgMock.restore();
      });
    });
  });

  describe('.logoutUrl', function() {
    describe('given config is configured for organization', function() {
      beforeEach(function() {
        this.navigation = new cdb.admin.Navigation({}, {
          config: fakeOrganizationConfig
        });
      });

      it('should return the logout URL', function() {
        expect(this.navigation.logoutUrl()).toEqual('https://bodega.cartodb.com/logout');
      });
    });

    describe('given config is configured for a normal user', function() {
      beforeEach(function() {
        this.navigation = new cdb.admin.Navigation({}, {
          config: cdb.config
        });
      });

      it('should return the logout URL containing organization part', function() {
        expect(this.navigation.logoutUrl()).toEqual('/logout');
      });
    });
  });
});


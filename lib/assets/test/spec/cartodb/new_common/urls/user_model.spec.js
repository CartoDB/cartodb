var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls/user_model", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      id: 1,
      username: 'pepe'
    });

    this.mapUrlStub = jasmine.createSpyObj('aMapUrl', ['edit', 'public']);
    this.MapUrlModel = jasmine.createSpy('UserModel');
    this.MapUrlModel.and.returnValue(this.mapUrlStub);
    UserUrl.__set__('MapUrl', this.MapUrlModel);

    this.mapUrlForVisOwnerFnSpy = jasmine.createSpy('mapUrlForVisOwnerFn');

    this.url = new UserUrl({
      user: this.user,
      account_host: 'host.ext',
      mapUrlForVisOwnerFn: this.mapUrlForVisOwnerFnSpy
    });
  });

  describe('.toAccountSettings', function() {
    it('should return URL to account settings (is not located under same subdomain, so should be skipped)', function() {
      expect(this.url.toAccountSettings()).toEqual('http://host.ext/account/'+ this.user.get('username'));
    });
  });

  describe('.toUpgradeContactMail', function() {
    it('should return support mail where account can be upgraded', function() {
      expect(this.url.toUpgradeContactMail()).toEqual('support@cartodb.com');
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
      expect(this.url.toPublicProfile()).toEqual('http://pepe.host.ext');
    });
  });

  describe('.toApiKeys', function() {
    it("should return the URL to the user's API keys", function() {
      expect(this.url.toApiKeys()).toEqual('http://pepe.host.ext/your_apps');
    });
  });

  describe('.toLogout', function() {
    it("should return the logout URL", function() {
      expect(this.url.toLogout()).toEqual('http://pepe.host.ext/logout');
    });
  });

  describe('.mapUrl', function() {
    describe('given a visualization', function() {
      describe("and the current URL's user own the given Visualization", function() {
        beforeEach(function() {
          this.vis = new cdbAdmin.Visualization({
            permission: {
              owner: this.user.attributes
            }
          });
          this.mapUrl = this.url.mapUrl(this.vis);

          this.createdWithArgs = this.MapUrlModel.calls.argsFor(0)[0];
        });

        it('should return MapUrl object', function() {
          expect(this.mapUrl).toBe(this.mapUrlStub);
        });

        it('should have created MapUrl with the userUrl', function() {
          expect(this.createdWithArgs).toEqual(jasmine.objectContaining({ userUrl: this.url }));
        });

        it('should have created MapUrl with visualization', function() {
          expect(this.createdWithArgs).toEqual(jasmine.objectContaining({ vis: this.vis }));
        });
      });

      describe("and the owner of the vis is another user", function() {
        beforeEach(function() {
          // since owner is not a real User obj
          this.vis = new cdbAdmin.Visualization({
            permission: {
              owner: {
                id: 3,
                username: 'paco'
              }
            }
          });
          this.mapUrlStub = jasmine.createSpyObj('MapUrl', ['toEdit']);
          this.mapUrlForVisOwnerFnSpy.and.returnValue(this.mapUrlStub);
          
          this.mapUrl = this.url.mapUrl(this.vis);
        });

        it('should create mapUrl model from other user', function() {
          expect(this.mapUrlForVisOwnerFnSpy).toHaveBeenCalled();
        });

        it('should have created mapUrl with given visualization', function() {
          expect(this.mapUrlForVisOwnerFnSpy.calls.argsFor(0)[0]).toBe(this.vis);
        });
        
        it('should return new mapUrl obj', function() {
          expect(this.mapUrl).toBe(this.mapUrlStub);
        });
      });
    });
  });
});

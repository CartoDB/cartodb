var UserUrl = require('../../../../../javascripts/cartodb/new_common/urls/user_model');
var urlsFn = require('../../../../../javascripts/cartodb/new_common/urls_fn');
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

    this.datasetsUrl = jasmine.createSpyObj('aDatasetsUrl', ['toDefault']);
    this.DatasetsUrlSpy = jasmine.createSpy('DatasetsUrl');
    this.DatasetsUrlSpy.and.returnValue(this.datasetsUrl);
    this.originalDatasetsUrl = UserUrl.__get__('DatasetsUrl');
    UserUrl.__set__('DatasetsUrl', this.DatasetsUrlSpy);

    this.mapsUrl = jasmine.createSpyObj('aMapsUrl', ['toDefault']);
    this.MapsUrlSpy = jasmine.createSpy('MapsUrl');
    this.MapsUrlSpy.and.returnValue(this.mapsUrl);
    this.originalMapsUrl = UserUrl.__get__('MapsUrl');
    UserUrl.__set__('MapsUrl', this.MapsUrlSpy);

    this.urls = urlsFn('account_host');

    this.url = new UserUrl({
      user: this.user,
      account_host: 'host.ext',
      urls: this.urls
    });
  });

  describe('.host', function() {
    it('should return the host part of the URL', function() {
      expect(this.url.toAccountSettings()).toMatch('(http|file)://host.ext');
    });
  });

  describe('.rootPath', function() {
    it('should return the root path', function() {
      expect(this.url.rootPath()).toEqual('');
    });
  });

  describe('.toAccountSettings', function() {
    it('should return URL to account settings (is not located under same subdomain, so should be skipped)', function() {
      expect(this.url.toAccountSettings()).toMatch('(http|file)://host.ext/account/'+ this.user.get('username'));
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
      expect(this.url.toPublicProfile()).toMatch('(http|file)://pepe.host.ext');
    });
  });

  describe('.toApiKeys', function() {
    it("should return the URL to the user's API keys", function() {
      expect(this.url.toApiKeys()).toMatch('(http|file)://pepe.host.ext/your_apps');
    });
  });

  describe('.toLogout', function() {
    it("should return the logout URL", function() {
      expect(this.url.toLogout()).toMatch('(http|file)://pepe.host.ext/logout');
    });
  });

  describe('.toDashboard', function() {
    it("should return the dashboard home URL", function() {
      expect(this.url.toDashboard()).toMatch('(http|file)://pepe.host.ext/dashboard');
    });
  });

  describe('.mapUrl', function() {
    describe('given a visualization', function() {
      describe("and the current URL's user own the given Visualization", function() {
        beforeEach(function() {
          this.vis = new cdbAdmin.Visualization({
          });
          spyOn(this.vis, 'isOwnedByUser').and.returnValue(true);
          this.mapUrl = this.url.mapUrl(this.vis);

          this.createdWithArgs = this.MapUrlModel.calls.argsFor(0)[0];
        });

        it('should have checked if owned by given user', function() {
          expect(this.vis.isOwnedByUser).toHaveBeenCalledWith(this.url.get('user'));
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
          });
          spyOn(this.vis, 'isOwnedByUser').and.returnValue(false);
          spyOn(this.urls, 'mapUrl');
          this.otherMapUrlStub = jasmine.createSpyObj('mapUrl', ['toPublic']);
          this.urls.mapUrl.and.returnValue(this.otherMapUrlStub);

          this.mapUrl = this.url.mapUrl(this.vis);
        });

        it('should have checked if owned by given user', function() {
          expect(this.vis.isOwnedByUser).toHaveBeenCalledWith(this.url.get('user'));
        });

        it('should create mapUrl model from other user', function() {
          expect(this.urls.mapUrl).toHaveBeenCalled();
        });

        it('should have created mapUrl with given visualization', function() {
          expect(this.urls.mapUrl.calls.argsFor(0)[0]).toBe(this.vis);
        });

        it('should return new mapUrl obj', function() {
          expect(this.mapUrl).toBe(this.otherMapUrlStub);
        });
      });
    });
  });

  describe('.datasetsUrl', function() {
    beforeEach(function() {
      this.datasetsUrl = this.url.datasetsUrl();
    });

    it('should return a datasetsUrl', function() {
      expect(this.datasetsUrl).toBe(this.datasetsUrl);
    });

    it('should have created datasetsUrl with user url', function() {
      expect(this.DatasetsUrlSpy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ userUrl: this.url }));
    });
  });

  describe('.mapsUrl', function() {
    beforeEach(function() {
      this.mapUrl = this.url.mapsUrl();
    });

    it('should return a mapsUrl', function() {
      expect(this.mapUrl).toBe(this.mapsUrl);
    });

    it('should have created mapsUrl with user url', function() {
      expect(this.MapsUrlSpy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ userUrl: this.url }));
    });
  });

  afterEach(function() {
    UserUrl.__set__('DatasetsUrl', this.originalDatasetsUrl);
    UserUrl.__set__('MapsUrl', this.originalMapsUrl);
  });
});

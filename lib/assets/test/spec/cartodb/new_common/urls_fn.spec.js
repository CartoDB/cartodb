var urls = require('new_common/urls_fn');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls_fn", function() {
  describe('given a account host', function() {
    beforeEach(function() {
      this.accountHost = 'cartodb.com';

      this.urls = urls(this.accountHost);

      this.modelCreatedWithArgs = function(Model) {
        return Model.calls.argsFor(0)[0];
      }
    });

    it('should return an object through which one can get URL representations', function() {
      expect(this.urls.userUrl).toEqual(jasmine.any(Function));
      expect(this.urls.mapUrl).toEqual(jasmine.any(Function));
    });

    describe('.userUrl', function() {
      describe('given a normal user', function() {
        beforeEach(function() {
          this.user = new cdbAdmin.User({});

          this.normalUserStub = jasmine.createSpyObj('aUserUrl', ['set']);
          this.UserModel = jasmine.createSpy('UserModel');
          this.UserModel.and.returnValue(this.normalUserStub);
          urls.__set__('UserUrl', this.UserModel);

          this.url = this.urls.userUrl(this.user);
          this.modelCreatedWith = this.modelCreatedWithArgs(this.UserModel);
        });

        it('should return a normal user URL', function() {
          expect(this.url).toBe(this.normalUserStub);
        });

        it('should create url w/ given user', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ user: this.user }));
        });

        it('should create url w/ account host', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ account_host: this.accountHost }));
        });

        it('should create url w/ mapUrl fn passed as special function to create mapUrl for visualization owner', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ mapUrlForVisOwnerFn: this.urls.mapUrl }));
        });
      });

      describe('given a organization user', function() {
        beforeEach(function() {
          this.user = new cdbAdmin.User({
            organization: {
              name: 'team'
            }
          });

          this.orgUserStub = jasmine.createSpyObj('aOrganizationUserUrl', ['foobar']);
          this.OrganizationUserModel = jasmine.createSpy('OrganizationUserModel');
          this.OrganizationUserModel.and.returnValue(this.orgUserStub);
          urls.__set__('OrganizationUserUrl', this.OrganizationUserModel);

          this.url = this.urls.userUrl(this.user);
          this.modelCreatedWith = this.modelCreatedWithArgs(this.OrganizationUserModel);
        });

        it('should return a OrganizationUser URL', function() {
          expect(this.url).toBe(this.orgUserStub);
        });

        it('should create url w/ given user', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ user: this.user }));
        });

        it('should create url w/ account host', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ account_host: this.accountHost }));
        });

        it('should create url w/ mapUrl fn passed as special function to create mapUrl for visualization owner', function() {
          expect(this.modelCreatedWith).toEqual(jasmine.objectContaining({ mapUrlForVisOwnerFn: this.urls.mapUrl }));
        });
      });
    });

    describe('.mapUrl', function() {
      describe('given a Visualization model', function() {
        beforeEach(function() {
          this.vis = new cdbAdmin.Visualization({
            owner: {
              id: 123,
              username: 'pako'
            }
          });

          this.mapUrlStub = jasmine.createSpyObj('aMapUrl', ['edit', 'public']);
          this.userStub = jasmine.createSpyObj('aUserUrl', ['mapUrl']);
          this.userStub.mapUrl.and.returnValue(this.mapUrlStub);
          this.UserModel = jasmine.createSpy('UserModel');
          this.UserModel.and.returnValue(this.userStub);
          urls.__set__('UserUrl', this.UserModel);

          this.mapUrl = this.urls.mapUrl(this.vis);
        });

        it('should return a MapUrl object', function() {
          expect(this.mapUrl).toBe(this.mapUrlStub);
        });

        it("should create the MapUrl from the vis owner's user URL model (for the URL to point to the correct location)", function() {
          expect(this.modelCreatedWithArgs(this.UserModel)).toEqual(jasmine.objectContaining({ user: jasmine.any(Object) }));
          expect(this.modelCreatedWithArgs(this.UserModel).user instanceof cdbAdmin.User).toBeTruthy();
        });

        it('should pass the vis object to the map Url when created', function() {
          expect(this.userStub.mapUrl).toHaveBeenCalledWith(this.vis);
        });
      });
    });
  });
});

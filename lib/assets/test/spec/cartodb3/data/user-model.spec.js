var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/user-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new UserModel({
      id: 'uuid',
      organization: {
        id: 'o1'
      }
    }, {
      configModel: configModel
    });
  });

  it('should create an organization', function () {
    expect(this.model._organizationModel.id).toEqual('o1');
  });

  it("shouldn't set avatar_url is it comes with null value", function () {
    expect(this.model.get('avatar_url')).toBe('http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png');
  });

  it('isInsideOrg', function () {
    this.model._organizationModel._usersCollection.reset([]);
    this.model._organizationModel.id = '';
    expect(this.model.isInsideOrg()).toEqual(false);
    this.model._organizationModel._usersCollection.add(new UserModel({}, { configModel: 'c' }));
    this.model._organizationModel._usersCollection.add(new UserModel({}, { configModel: 'c' }));
    expect(this.model.isInsideOrg()).toEqual(false);
    this.model._organizationModel.id = 'hello-org-id';
    expect(this.model.isInsideOrg()).toEqual(true);
  });

  it('isOrgAdmin', function () {
    this.model._organizationModel._ownerModel = this.model;
    expect(this.model.isOrgAdmin()).toEqual(true);
    this.model._organizationModel._ownerModel = new UserModel({
      id: 'test',
      organization: {}
    }, { configModel: 'c' });
    expect(this.model.isOrgAdmin()).toEqual(false);
  });

  it('should answer if user can create new datasets', function () {
    this.model.set('remaining_byte_quota', 0);
    expect(this.model.canCreateDatasets()).toEqual(false);
    this.model.set('remaining_byte_quota', 10);
    expect(this.model.canCreateDatasets()).toEqual(true);
    this.model.set('remaining_byte_quota', undefined);
    this.model.unset('remaining_byte_quota');
    expect(this.model.canCreateDatasets()).toEqual(false);
  });

  it('hasFeatureFlagEnabled', function () {
    var flagOK = 'test_flag';
    var feature_flags = [];
    feature_flags.push(flagOK);
    this.model.set('feature_flags', feature_flags);

    expect(this.model.featureEnabled(flagOK)).toEqual(true);
    expect(this.model.featureEnabled('flagWrong')).toEqual(false);
  });

  describe('.upgradeContactEmail', function () {
    describe('when is a normal user', function () {
      beforeEach(function () {
        spyOn(this.model, 'isInsideOrg').and.returnValue(false);
      });

      it('should return the general support email', function () {
        expect(this.model.upgradeContactEmail()).toEqual('support@cartodb.com');
      });
    });

    describe('when us a organization user', function () {
      beforeEach(function () {
        spyOn(this.model, 'isInsideOrg').and.returnValue(true);
      });

      describe('when user is also admin of organization', function () {
        beforeEach(function () {
          spyOn(this.model, 'isOrgAdmin').and.returnValue(true);
        });

        it('should return enterprise support email', function () {
          expect(this.model.upgradeContactEmail()).toEqual('enterprise-support@cartodb.com');
        });
      });

      describe('when user is a normal organization member', function () {
        beforeEach(function () {
          this.model._organizationModel._ownerModel = new UserModel({
            email: 'owner@org.com'
          }, {
            configModel: 'c'
          });
        });

        it('should return the organiation owner email', function () {
          expect(this.model.upgradeContactEmail()).toEqual('owner@org.com');
        });
      });
    });
  });

  describe('.nameOrUsername', function () {
    it('should return the name or username as fallback if name is not available', function () {
      this.model.set('username', 'kalle');
      expect(this.model.nameOrUsername()).toEqual('kalle');

      this.model.set('name', 'Kalle Anka');
      expect(this.model.nameOrUsername()).toEqual('Kalle Anka');
    });
  });
});

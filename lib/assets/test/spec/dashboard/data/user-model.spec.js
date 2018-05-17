const _ = require('underscore');
const Backbone = require('backbone');
const UserModel = require('dashboard/data/user-model');
const UserGroupsCollection = require('dashboard/data/user-groups-collection');
const OrganizationModel = require('dashboard/data/organization-model');
const getObjectValue = require('deep-insights/util/get-object-value');

var USER_MODEL_OPTS = {
  configModel: require('fixtures/dashboard/config-model.fixture')
};

describe('dashboard/data/user-model', function () {
  var user;

  var createModelFn = function (options) {
    const userPayload = _.extend({
      base_url: 'http://team.carto.com/u/pepe',
      id: 'uuid',
      organization: {
        id: 'o1',
        admins: []
      },
      groups: [{
        id: 'g1',
        display_name: 'my group'
      }]
    }, options);

    user = new UserModel(userPayload, USER_MODEL_OPTS);

    const organization = new OrganizationModel(
      userPayload.organization,
      {
        currentUserId: userPayload.id,
        configModel: USER_MODEL_OPTS.configModel
      }
    );
    organization.owner = new UserModel(getObjectValue(userPayload, 'organization.owner'));
    user.setOrganization(organization);

    const groups = new UserGroupsCollection(userPayload.groups, {
      organization: _.result(user.collection, 'organization') || user.organization,
      configModel: USER_MODEL_OPTS.configModel
    });
    user.setGroups(groups);

    return user;
  };

  beforeEach(function () {
    createModelFn();
  });

  it('should create an organization', function () {
    expect(user.organization.id).toEqual('o1');
  });

  it('should create a user groups collection', function () {
    expect(user.groups).toBeDefined();
    expect(user.groups.length).toEqual(1);
    expect(user.groups.organization).toBeDefined();
  });

  it('shouldn\'t set avatar_url is it comes with null value', function () {
    var user1 = new UserModel({ avatar_url: null }, USER_MODEL_OPTS);

    expect(user1.get('avatar_url')).toBe('http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png');
  });

  it('isAuthUsernamePasswordEnabled', function () {
    user.organization.set('auth_username_password_enabled', true);

    expect(user.isAuthUsernamePasswordEnabled()).toEqual(true);

    user.organization.set('auth_username_password_enabled', false);

    expect(user.isAuthUsernamePasswordEnabled()).toEqual(false);
  });

  it('isInsideOrg', function () {
    user.organization.users.reset([]);
    user.organization.id = false;

    expect(user.isInsideOrg()).toEqual(false);

    user.organization.users.add(new UserModel(undefined, USER_MODEL_OPTS));

    expect(user.isInsideOrg()).toEqual(false);

    user.organization.id = 'hello-org-id';

    expect(user.isInsideOrg()).toEqual(true);
  });

  it('isOrgOwner', function () {
    user.organization.owner = user;

    expect(user.isOrgOwner()).toEqual(true);

    user.organization.owner = new UserModel({
      id: 'test',
      organization: {}
    }, USER_MODEL_OPTS);

    expect(user.isOrgOwner()).toEqual(false);
  });

  it('isOrgAdmin', function () {
    user.organization.set('admins', [{id: user.id}]);

    expect(user.isOrgAdmin()).toEqual(true);

    user.organization.set('admins', [{id: 'not_me'}]);

    expect(user.isOrgAdmin()).toEqual(false);

    user.organization = null;

    expect(user.isOrgAdmin()).toEqual(false);
  });

  it('should answer if user can create new datasets', function () {
    user.set('remaining_byte_quota', 0);

    expect(user.canCreateDatasets()).toEqual(false);

    user.set('remaining_byte_quota', 10);

    expect(user.canCreateDatasets()).toEqual(true);

    user.set('remaining_byte_quota', undefined);
    user.unset('remaining_byte_quota');

    expect(user.canCreateDatasets()).toEqual(false);
  });

  it('hasFeatureFlagEnabled', function () {
    var flagOK = 'test_flag';
    var feature_flags = [];
    feature_flags.push(flagOK);
    user.set('feature_flags', feature_flags);

    expect(user.featureEnabled(flagOK)).toEqual(true);
    expect(user.featureEnabled('flagWrong')).toEqual(false);
  });

  describe('.equals', function () {
    describe('given same user', function () {
      it('should return true', function () {
        expect(user.equals(user)).toBeTruthy();
      });
    });

    describe('given not same user', function () {
      it('should return false', function () {
        expect(user.equals(new UserModel(undefined, USER_MODEL_OPTS))).toBeFalsy();
        expect(user.equals(new Backbone.Model())).toBeFalsy();
      });
    });
  });

  describe('.viewUrl', function () {
    it('should return a user URL', function () {
      expect(user.viewUrl()).toEqual(jasmine.any(Object));
    });

    it('should have been set with base url', function () {
      expect(user.viewUrl().get('base_url')).toEqual('http://team.carto.com/u/pepe');
    });

    it('should have been created with if user is org admin or not', function () {
      expect(user.viewUrl().get('is_org_admin')).toBeFalsy();

      spyOn(user, 'isOrgAdmin').and.returnValue(true);
      expect(user.viewUrl().get('is_org_admin')).toBeTruthy();
    });
  });

  describe('.upgradeContactEmail', function () {
    describe('when is a normal user', function () {
      beforeEach(function () {
        spyOn(user, 'isInsideOrg').and.returnValue(false);
      });

      it('should return the general support email', function () {
        expect(user.upgradeContactEmail()).toEqual('support@carto.com');
      });
    });

    describe('when us a organization user', function () {
      beforeEach(function () {
        spyOn(user, 'isInsideOrg').and.returnValue(true);
      });

      describe('when user is also admin of organization', function () {
        beforeEach(function () {
          spyOn(user, 'isOrgOwner').and.returnValue(true);
        });

        it('should return enterprise support email', function () {
          expect(user.upgradeContactEmail()).toEqual('enterprise-support@carto.com');
        });
      });

      describe('when user is a normal organization member', function () {
        beforeEach(function () {
          user.organization.owner = new UserModel({
            email: 'owner@org.com'
          }, USER_MODEL_OPTS);
        });

        it('should return the organiation owner email', function () {
          expect(user.upgradeContactEmail()).toEqual('owner@org.com');
        });
      });
    });
  });

  describe('.nameOrUsername', function () {
    it('should return the name or username as fallback if name is not available', function () {
      user.set('username', 'kalle');

      expect(user.nameOrUsername()).toEqual('kalle');

      user.set('name', 'Kalle');

      expect(user.nameOrUsername()).toEqual('Kalle');

      user.set('last_name', 'Anka');

      expect(user.nameOrUsername()).toEqual('Kalle Anka');

      user.set('name', '');

      expect(user.nameOrUsername()).toEqual('Anka');
    });
  });

  describe('.needsPasswordConfirmation', function () {
    it('should return false if user has needs_password_confirmation property set to false', function () {
      createModelFn({
        needs_password_confirmation: false
      });

      expect(user.needsPasswordConfirmation()).toBe(false);
    });

    it('should return true if user has needs_password_confirmation property set to true', function () {
      createModelFn({
        needs_password_confirmation: true
      });

      expect(user.needsPasswordConfirmation()).toBe(true);
    });
  });
});

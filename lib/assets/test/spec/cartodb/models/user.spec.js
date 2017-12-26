/* global cdb */

describe('cdb.admin.User', function () {
  var user;

  beforeEach(function () {
    user = new cdb.admin.User({
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
    });
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
    var user1 = new cdb.admin.User({ avatar_url: null });

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

    user.organization.users.add(new cdb.admin.User());

    expect(user.isInsideOrg()).toEqual(false);

    user.organization.id = 'hello-org-id';

    expect(user.isInsideOrg()).toEqual(true);
  });

  it('isOrgOwner', function () {
    user.organization.owner = user;

    expect(user.isOrgOwner()).toEqual(true);

    user.organization.owner = new cdb.admin.User({
      id: 'test',
      organization: {}
    });

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
        expect(user.equals(new cdb.admin.User())).toBeFalsy();
        expect(user.equals(new cdb.core.Model())).toBeFalsy();
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
          user.organization.owner = new cdb.admin.User({
            email: 'owner@org.com'
          });
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

  describe('canAddLayerTo', function () {
    beforeEach(function () {
      this.map = new cdb.admin.Map({
        provider: 'leaflet'
      });
      this.map.layers.reset([
        new cdb.admin.CartoDBLayer({ type: 'CartoDB', id: 1, table_name: 'test_table_1' }),
        new cdb.admin.CartoDBLayer({ type: 'CartoDB', id: 2, table_name: 'test_table_2' })
      ]);
      user.set('limits', { max_layers: 3 });
    });

    it('should be true when user has not reached layer limits', function () {
      expect(user.canAddLayerTo(this.map)).toBeTruthy();
    });

    it('should not be true when user has reached layer limits', function () {
      user.set('limits', { max_layers: 2 });

      expect(user.canAddLayerTo(this.map)).toBeFalsy();
    });

    it('should raise an error when map argument is not defined', function () {
      expect(function () { user.canAddLayerTo(); }).toThrow(new Error('Map model is not defined or wrong'));
      expect(function () { user.canAddLayerTo({ layers: {} }); }).toThrow(new Error('Map model is not defined or wrong'));
    });
  });
});

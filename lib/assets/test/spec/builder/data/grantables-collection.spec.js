var GrantablesCollection = require('builder/data/grantables-collection');
var ConfigModel = require('builder/data/config-model');
var OrganizationModel = require('builder/data/organization-model');

describe('data/grantables-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.org = new OrganizationModel({
      id: 'org1',
      owner: {
        id: 'hello',
        username: 'dev',
        email: 'hello@hello'
      }
    }, {
      configModel: configModel
    });

    this.grantables = new GrantablesCollection([], {
      configModel: configModel,
      organization: this.org,
      currentUserId: 'u2'
    });
  });

  it('should have a working URL', function () {
    expect(this.grantables.url()).toMatch('/u/pepe/api/v1/organization/org1/grantables');
  });

  describe('when is fetched', function () {
    beforeEach(function () {
      this.grantables.sync = function (a, b, options) {
        options.success({
          'grantables': [{
            'id': 'u1',
            'type': 'user',
            'name': 'an user',
            'avatar_url': 'images/avatars/avatar_marker_red.png',
            'model': {
              'id': 'u1',
              'username': 'foo'
            }
          }, {
            'id': 'u2',
            'type': 'user',
            'name': 'current user'
          }, {
            'id': 'g1',
            'type': 'group',
            'name': 'my group',
            'avatar_url': 'avatar_marker_red.png',
            'model': {
              'id': 'g1',
              'display_name': 'my group',
              'name': 'my_group'
            }
          }],
          'total_entries': 3
        });
      };

      this.grantables.fetch();
    });

    it('should set grantables model', function () {
      expect(this.grantables.length).toBe(2);
    });

    it('should have a organization set on collection', function () {
      expect(this.grantables.organization).toBe(this.org);
    });

    it('should not add current user', function () {
      expect(this.grantables.length).toEqual(2);
      expect(this.grantables.total_entries).toEqual(2);
      expect(this.grantables.pluck('id')).toEqual(['u1', 'g1']);
    });

    it('should set organization on each entity model', function () {
      expect(this.grantables.first().get('organization')).toBe(this.org);
      expect(this.grantables.last().get('organization')).toBe(this.org);
    });
  });

  describe('totalCount', function () {
    it('should not be set initially', function () {
      expect(this.grantables.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function () {
      beforeEach(function () {
        this.grantables.sync = function (a, b, options) {
          options.success({
            grantables: [],
            total_entries: 77
          });
        };

        this.grantables.fetch();
      });

      it('should have the total count set', function () {
        expect(this.grantables.totalCount()).toEqual(77);
      });
    });
  });
});

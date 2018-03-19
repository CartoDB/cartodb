const GrantablesCollection = require('dashboard/data/grantables-collection');

const organizationModel = require('fixtures/dashboard/organization-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/grantables-collection', function () {
  beforeEach(function () {
    this.org = organizationModel;
    this.grantables = new GrantablesCollection(undefined, {
      organization: this.org,
      currentUserId: 'u2',
      configModel
    });
  });

  it('should have a working URL', function () {
    expect(this.grantables.url()).toMatch('/organization/o1/grantables');
  });

  describe('when is fetched', function () {
    beforeEach(function () {
      this.grantables.sync = function (a, b, opts) {
        opts.success && opts.success({
          'grantables': [{
            'id': 'u1',
            'type': 'user',
            'name': 'an user',
            'avatar_url': 'images/avatars/avatar_marker_red.png',
            'model': {
              'id': 'u1',
              'username': 'foo'
              // …
            }
          }, {
            'id': 'u2' // current user
          }, {
            'id': 'g1',
            'type': 'group',
            'name': 'my group',
            'avatar_url': 'avatar_marker_red.png',
            'model': {
              'id': 'g1',
              'display_name': 'my group',
              'name': 'my_group'
              // …
            }
          }],
          'total_entries': 3
        });
      };
      this.grantables.fetch();
    });

    it('should set grantables model', function () {
      expect(this.grantables.length).toBeGreaterThan(0);
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
      expect(this.grantables.first().entity.organization).toBe(this.org);
      expect(this.grantables.last().entity.organization).toBe(this.org);
    });
  });

  describe('.totalCount', function () {
    it('should not be set initially', function () {
      expect(this.grantables.totalCount()).toBeUndefined();
    });

    describe('when data is fetched', function () {
      beforeEach(function () {
        this.grantables.sync = function (a, b, opts) {
          opts.success && opts.success({
            grantables: [
            ],
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

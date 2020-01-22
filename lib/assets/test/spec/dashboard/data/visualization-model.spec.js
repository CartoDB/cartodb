const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const VisualizationModel = require('dashboard/data/visualization-model');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

// ==================================================
//
//
//
//  THOSE TEST ARE **REALLY** IMPORTANT SO IF SOME
//  OF THEM IS BROKEN, PLEASE, TAKE CARE OF IT
//
//  Visualization model specs
//
// ==================================================

describe('Visualization model', function () {
  var vis, map_id;

  beforeEach(function () {
    // cdb.admin.CartoDBLayer.updateCartoCss = function () {};
    map_id = 96;

    // Visualization model
    vis = new VisualizationModel({
      map_id: map_id,
      active_layer_id: null,
      name: 'test_table',
      description: 'Visualization description',
      tags: ['jamon', 'probando', 'test'],
      privacy: 'PUBLIC',
      updated_at: '2013-03-04T18:09:34+01:00',
      type: 'table',
      permission: {
        owner: {
          username: 'rambo',
          base_url: 'http://team.carto.com/u/rambo'
        },
        acl: [
          {
            type: 'user',
            access: 'r',
            entity: {
              username: 'charly',
              base_url: 'http://team.carto.com/u/charly'
            }
          }
        ]
      },
      transition_options: {
        action: 'click',
        time: 40
      },
      table: {
        name: '"rambo".test_table'
      }
    }, { configModel: ConfigModelFixture });
  });

  describe('transition_options', function () {
    it('should load transition_options', function () {
      expect(vis.transition.get('action')).toEqual('click');
    });

    it('should serailize transition_options', function () {
      vis.transition.set('time', 50);
      expect(vis.toJSON().transition_options).toEqual({ action: 'click', time: 50 });
    });
  });

  describe('permission', function () {
    it('should load permissions', function () {
      expect(vis.permission.owner.get('username')).toEqual('rambo');
      expect(vis.permission.acl.length).toEqual(1);
    });
  });

  /* defaults & config */
  describe('> defaults & config', function () {
    it('should define a number of ITEMS_PER_PAGE', function () {
      expect(VisualizationsCollection.prototype._ITEMS_PER_PAGE).toBeDefined();
    });

    it('should define a number of PREVIEW_ITEMS_PER_PAGE', function () {
      expect(VisualizationsCollection.prototype._PREVIEW_ITEMS_PER_PAGE).toBeDefined();
    });

    it('should setup map bindings by default', function () {
      expect(vis.get('bindMap')).toBeTruthy();
      expect(vis.map.get('id')).toEqual(map_id);
    });

    it("shouldn't setup map bindings when bindMap is false", function () {
      vis = new VisualizationModel({
        map_id: map_id,
        bindMap: false
      }, { configModel: ConfigModelFixture });

      expect(vis.get('bindMap')).toBeFalsy();
      expect(vis.map.get('id')).toEqual(undefined);
    });
  });

  /* map_id specs */
  describe('> map_id', function () {
    it('should set bindMap to false for all visualizations on parse/fetch', function () {
      var visualizations = new VisualizationsCollection({ type: 'derived' }, { configModel: ConfigModelFixture });
      var v = visualizations.parse({total_entries: 1, visualizations: [{ id: 1 }]});
      expect(v[0].bindMap).toBeFalsy();
    });
  });

  describe('.sharedWithEntities', function () {
    beforeEach(function () {
      this.sharedWithEntities = function () {
        return vis.sharedWithEntities();
      };
    });

    describe('given at least shared with one other user', function () {
      beforeEach(function () {
        // the permission object is set in the top-most beforeEach
        this.sharedWithEntities = this.sharedWithEntities();
      });

      it('should return an array containing the entities the visualization is shared with', function () {
        expect(this.sharedWithEntities.length).toEqual(1);
        expect(this.sharedWithEntities[0].get('username')).toEqual('charly');
      });
    });

    describe('given that model is not shared with anyone', function () {
      beforeEach(function () {
        vis.permission.acl.reset([], { silent: true });
      });

      it('should return an empty array', function () {
        expect(this.sharedWithEntities()).toEqual([]);
      });
    });
  });

  describe('.tableMetadata', function () {
    beforeEach(function () {
      vis.set({ table: { foo: 'bar' } }, { silent: true });
      this.tableMetadata = vis.tableMetadata();
    });

    it('should return a Table metadata object', function () {
      expect(this.tableMetadata instanceof CartoTableMetadata).toBeTruthy();
    });

    it('should return a single instance if called several times', function () {
      expect(this.tableMetadata).toBe(vis.tableMetadata());
    });

    it('should created the tableMetadata object with the table attributes', function () {
      expect(this.tableMetadata.get('foo')).toEqual('bar');
    });
  });

  describe('.privacyOptions', function () {
    describe('given a derived visualization (map)', function () {
      beforeEach(function () {
        this.vis = new VisualizationModel({
          type: 'derived'
        }, { configModel: ConfigModelFixture });
        this.privacyOptions = this.vis.privacyOptions();
      });

      it('should return all privacy options', function () {
        expect(this.privacyOptions.length).toEqual(4);
        expect(this.privacyOptions).toContain('PUBLIC');
        expect(this.privacyOptions).toContain('PRIVATE');
        expect(this.privacyOptions).toContain('LINK');
        expect(this.privacyOptions).toContain('PASSWORD');
      });
    });

    describe('given a table', function () {
      beforeEach(function () {
        this.vis = new VisualizationModel({
          type: 'table'
        }, { configModel: ConfigModelFixture });
        this.privacyOptions = this.vis.privacyOptions();
      });

      it('should return all privacy options but the password', function () {
        expect(this.privacyOptions.length).toEqual(3);
        expect(this.privacyOptions).toContain('PUBLIC');
        expect(this.privacyOptions).toContain('PRIVATE');
        expect(this.privacyOptions).toContain('LINK');
        expect(this.privacyOptions).not.toContain('PASSWORD');
      });
    });

    describe('given a kuviz', function () {
      beforeEach(function () {
        this.vis = new VisualizationModel({
          type: 'kuviz'
        }, { configModel: ConfigModelFixture });
        this.privacyOptions = this.vis.privacyOptions();
      });

      it('should return public and password options', function () {
        expect(this.privacyOptions.length).toEqual(2);
        expect(this.privacyOptions).toContain('PUBLIC');
        expect(this.privacyOptions).not.toContain('PRIVATE');
        expect(this.privacyOptions).not.toContain('LINK');
        expect(this.privacyOptions).toContain('PASSWORD');
      });
    });
  });

  describe('.viewUrl', function () {
    describe('when vis is a dataset', function () {
      beforeEach(function () {
        vis.set('type', 'table');
      });

      it('should return a new dataset URL', function () {
        expect(vis.viewUrl().toString()).toEqual('http://team.carto.com/u/rambo/tables/rambo.test_table');
      });

      describe('when given a current user', function () {
        it('should return the URL from perspective of owner', function () {
          expect(vis.viewUrl(vis.permission.owner).toString()).toEqual('http://team.carto.com/u/rambo/tables/rambo.test_table');
        });

        it('should return the URL from the perspective of shared user', function () {
          var userSharingVis = vis.permission.acl.first().get('entity');
          expect(vis.viewUrl(userSharingVis).toString()).toEqual('http://team.carto.com/u/charly/tables/rambo.test_table');
        });

        it('should return the URL from the perspective of owner if do not have read access', function () {
          var otherUser = new UserModel({
            id: 123,
            base_url: 'http://team.carto.com/u/current-user',
            username: 'current-user'
          });
          expect(vis.viewUrl(otherUser).toString()).toEqual('http://team.carto.com/u/rambo/tables/rambo.test_table');
        });
      });
    });

    describe('when vis is a map', function () {
      beforeEach(function () {
        vis.set('type', 'derived');
        vis.set('id', 'abc-123');
      });

      it('should return a new map URL', function () {
        expect(vis.viewUrl().toString()).toEqual('http://team.carto.com/u/rambo/viz/abc-123');
      });

      describe('when the type is not available', function () {
        it("should assume it's a map and thus return a new map URL", function () {
          vis.set('type', undefined);
          expect(vis.viewUrl().toString()).toEqual('http://team.carto.com/u/rambo/viz/abc-123');
        });
      });

      describe('when given a other current user (e.g. a shared map)', function () {
        beforeEach(function () {
          this.userSharingVis = vis.permission.acl.first().get('entity');
          this.userSharingVis.set('id', '123');
        });

        it('should return the URL from the perspective of the current user', function () {
          expect(vis.viewUrl(this.userSharingVis).toString()).toEqual('http://team.carto.com/u/charly/viz/rambo.abc-123');
        });
      });
    });

    describe('when vis is a kuviz', function () {
      beforeEach(function () {
        vis.set('type', 'kuviz');
        vis.set('id', 'abc-123');
        vis.set('url', 'http://team.carto.com/u/rambo/kuviz/abc-123');
      });

      it('should return the kuviz URL', function () {
        expect(vis.viewUrl().toString()).toEqual('http://team.carto.com/u/rambo/kuviz/abc-123');
      });
    });
  });
});

var cdb = require('cartodb.js-v3');
var RouterModel = require('../../../../../javascripts/cartodb/organization/groups_admin/router_model');

describe("organization/groups_admin/router", function() {
  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'https://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        owner: {
          id: 123
        }
      }
    });
    this.groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
    this.model = new RouterModel();
  });

  describe('.createGroupView', function() {
    beforeEach(function() {
      this.groups.add({
        id: 'g1',
        display_name: 'group that i already fetched'
      });
      this.fetchedCallbackSpy = jasmine.createSpy('fetchedCallback');
    });

    describe('when given a id of a group that already is fetched', function() {
      beforeEach(function() {
        this.model.createGroupView(this.groups, 'g1', this.fetchedCallbackSpy);
      });

      it('should call the fetched callback right away with the corresponding group', function() {
        expect(this.fetchedCallbackSpy).toHaveBeenCalled();
        expect(this.fetchedCallbackSpy).toHaveBeenCalledWith(this.groups.first());
      });
    });

    describe('when given a id of a group that is not yet fetched', function() {
      beforeEach(function() {
        spyOn(cdb.admin.Group.prototype, 'fetch');
        this.model.createGroupView(this.groups, 'other', this.fetchedCallbackSpy);
      });

      it('should fetch the group first', function() {
        expect(cdb.admin.Group.prototype.fetch).toHaveBeenCalled();
        expect(this.fetchedCallbackSpy).not.toHaveBeenCalled();
      });

      it('should fetch w/ users', function() {
        expect(cdb.admin.Group.prototype.fetch.calls.argsFor(0)[0].data.fetch_users).toBe(true);
      });

      describe('when fetch succeeds', function() {
        beforeEach(function() {
          cdb.admin.Group.prototype.fetch.calls.argsFor(0)[0].success();
        });

        it('should add the group to the collection', function() {
          expect(this.groups.get('other')).toBeDefined();
        });

        it('should call the fetched callback with the new group', function() {
          expect(this.fetchedCallbackSpy).toHaveBeenCalled();
          expect(this.fetchedCallbackSpy).toHaveBeenCalledWith(this.groups.get('other'));
        });
      });

      describe('when fetch fails', function() {
        beforeEach(function() {
          cdb.admin.Group.prototype.fetch.calls.argsFor(0)[0].error();
        });

        it('should create a generic error view', function() {
          var view = this.model.get('view');
          view.render();
          expect(this.innerHTML(view)).toContain('error');
        });
      });
    });
  });

  describe('.createLoadingView', function() {
    beforeEach(function() {
      this.model.createLoadingView('Loading something');
    });

    it('should create a loading view', function() {
      var view = this.model.get('view');
      view.render();
      expect(this.innerHTML(view)).toContain('Loading something');
    });
  });
});

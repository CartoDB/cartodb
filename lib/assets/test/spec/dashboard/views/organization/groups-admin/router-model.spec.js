const RouterModel = require('dashboard/views/organization/groups-admin/router-model');
const OrganizationGroupsCollection = require('dashboard/data/organization-groups-collection');
const OrganizationModel = require('dashboard/data/organization-model');
const GroupModel = require('dashboard/data/group-model');
const UserModel = require('dashboard/data/user-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/router-model', function () {
  beforeEach(function () {
    const organization = new OrganizationModel({
      owner: {
        id: 123
      }
    }, { configModel });

    const user = new UserModel({
      id: 123,
      base_url: 'https://carto.com/user/paco',
      username: 'paco'
    });
    user.setOrganization(organization);

    this.groups = new OrganizationGroupsCollection([], {
      organization: user.organization,
      configModel
    });

    this.model = new RouterModel();
  });

  describe('.createGroupView', function () {
    beforeEach(function () {
      this.groups.add({
        id: 'g1',
        display_name: 'group that i already fetched'
      });
      this.fetchedCallbackSpy = jasmine.createSpy('fetchedCallback');
    });

    describe('when given a id of a group that already is fetched', function () {
      beforeEach(function () {
        this.model.createGroupView(this.groups, 'g1', this.fetchedCallbackSpy);
      });

      it('should call the fetched callback right away with the corresponding group', function () {
        expect(this.fetchedCallbackSpy).toHaveBeenCalled();
        expect(this.fetchedCallbackSpy).toHaveBeenCalledWith(this.groups.first());
      });
    });

    describe('when given a id of a group that is not yet fetched', function () {
      beforeEach(function () {
        spyOn(GroupModel.prototype, 'fetch');
        this.model.createGroupView(this.groups, 'other', this.fetchedCallbackSpy);
      });

      it('should fetch the group first', function () {
        expect(GroupModel.prototype.fetch).toHaveBeenCalled();
        expect(this.fetchedCallbackSpy).not.toHaveBeenCalled();
      });

      it('should fetch w/ users', function () {
        expect(GroupModel.prototype.fetch.calls.argsFor(0)[0].data.fetch_users).toBe(true);
      });

      describe('when fetch succeeds', function () {
        beforeEach(function () {
          GroupModel.prototype.fetch.calls.argsFor(0)[0].success();
        });

        it('should add the group to the collection', function () {
          expect(this.groups.get('other')).toBeDefined();
        });

        it('should call the fetched callback with the new group', function () {
          expect(this.fetchedCallbackSpy).toHaveBeenCalled();
          expect(this.fetchedCallbackSpy).toHaveBeenCalledWith(this.groups.get('other'));
        });
      });

      describe('when fetch fails', function () {
        beforeEach(function () {
          GroupModel.prototype.fetch.calls.argsFor(0)[0].error();
        });

        it('should create a generic error view', function () {
          var view = this.model.get('view');
          view.render();
          expect(this.innerHTML(view)).toContain('error');
        });
      });
    });
  });

  describe('.createLoadingView', function () {
    beforeEach(function () {
      this.model.createLoadingView('Loading something');
    });

    it('should create a loading view', function () {
      var view = this.model.get('view');
      view.render();
      expect(this.innerHTML(view)).toContain('Loading something');
    });
  });
});

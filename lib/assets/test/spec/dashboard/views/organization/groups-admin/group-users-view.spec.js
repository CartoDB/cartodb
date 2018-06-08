const GroupUsersView = require('dashboard/views/organization/groups-admin/group-users/group-users-view');
const GroupModel = require('dashboard/data/group-model');
const UserModel = require('dashboard/data/user-model');
const OrganizationModel = require('dashboard/data/organization-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/organization/views/groups-admin/group-users/group-users-view', function () {
  beforeEach(function () {
    this.organization = new OrganizationModel({
      id: 'org-id',
      users: [{
        id: 'abc-123',
        username: 'paco'
      },
      {
        id: 'abc-456',
        username: 'pepe'
      }]
    }, { configModel });

    this.user = new UserModel({
      id: 'user-id',
      username: 'pepe',
      actions: {}
    });
    this.user.setOrganization(this.organization);

    this.group = new GroupModel({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'u1',
        username: 'pachi'
      }]
    }, { configModel });
    this.groupUsers = this.group.users;
    this.groupUsers.sync = (a, b, opts) => {
      this.syncOpts = opts;
    };

    this.view = new GroupUsersView({
      group: this.group,
      orgUsers: this.user.organization.users,
      userModel: new UserModel()
    });
    this.view.render();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a loading view initially', function () {
    expect(this.innerHTML()).toContain('Getting users');
  });

  describe('when group users are fetched', function () {
    describe('when there are no group users', function () {
      beforeEach(function () {
        this.syncOpts.success({
          users: [],
          total_user_entries: 0,
          total_entries: 0
        });
      });

      it('should render the empty view', function () {
        expect(this.innerHTML()).not.toContain('Remove'); // btn
      });

      it('should not have leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });

      describe('when group users are added', function () {
        beforeEach(function () {
          this.syncOpts.success({
            users: [{
              id: 'gu-1',
              username: 'pepito'
            }],
            total_user_entries: 1,
            total_entries: 1
          });
          this.groupUsers.fetch();
        });

        it('should render the group users', function () {
          expect(this.innerHTML()).toContain('pepito');
        });

        it('should not have leaks', function () {
          expect(this.view).toHaveNoLeaks();
        });
      });
    });

    describe('when there are at least one group user', function () {
      beforeEach(function () {
        this.syncOpts.success({
          users: [{
            id: 'gu-2',
            username: 'bollibompa'
          }],
          total_user_entries: 1,
          total_entries: 1
        });
      });

      it('should render the group users', function () {
        expect(this.innerHTML()).toContain('bollibompa');
      });

      it('should not have leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });

      describe('when group is emptied', function () {
        beforeEach(function () {
          this.syncOpts.success({
            users: [],
            total_user_entries: 0,
            total_entries: 0
          });
          this.groupUsers.fetch();
        });

        it('should render the empty view', function () {
          expect(this.innerHTML()).not.toContain('Remove'); // btn
          expect(this.innerHTML()).not.toContain('bollibompa');
        });
      });
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});

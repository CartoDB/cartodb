var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var GroupUsersView = require('../../../../../javascripts/cartodb/organization/groups_admin/group_users_view');

describe('organization/groups_admin/group_users_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      organization: {
        id: 'org-id',
        users: [{
          id: 'abc-123',
          username: 'paco'
        },
        {
          id: 'abc-456',
          username: 'pepe'
        }]
      }
    });

    this.group = new cdb.admin.Group({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'u1',
        username: 'pachi'
      }]
    });
    this.groupUsers = this.group.users;
    var self = this;
    this.groupUsers.sync = function(a,b,opts) {
      self.syncOpts = opts;
    };

    this.view = new GroupUsersView({
      group: this.group,
      orgUsers: this.user.organization.users
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a loading view initially', function() {
    expect(this.innerHTML()).toContain('Getting users');
  });

  describe('when group users are fetched', function() {
    describe('when there are no group users', function() {
      beforeEach(function() {
        this.syncOpts.success({
          users: [],
          total_user_entries: 0,
          total_entries: 0
        });
      });

      it('should render the empty view', function() {
        expect(this.innerHTML()).not.toContain('Remove'); //btn
      });

      it('should not have leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });

      describe('when group users are added', function() {
        beforeEach(function() {
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

        it('should render the group users', function() {
          expect(this.innerHTML()).toContain('pepito');
        });

        it('should not have leaks', function() {
          expect(this.view).toHaveNoLeaks();
        });
      });
    });

    describe('when there are at least one group user', function() {
      beforeEach(function() {
        this.syncOpts.success({
          users: [{
            id: 'gu-2',
            username: 'bollibompa'
          }],
          total_user_entries: 1,
          total_entries: 1
        });
      });

      it('should render the group users', function() {
        expect(this.innerHTML()).toContain('bollibompa');
      });

      it('should not have leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });

      describe('when group is emptied', function() {
        beforeEach(function() {
          this.syncOpts.success({
            users: [],
            total_user_entries: 0,
            total_entries: 0
          });
          this.groupUsers.fetch();
        });

        it('should render the empty view', function() {
          expect(this.innerHTML()).not.toContain('Remove'); //btn
          expect(this.innerHTML()).not.toContain('bollibompa');
        });
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });

});

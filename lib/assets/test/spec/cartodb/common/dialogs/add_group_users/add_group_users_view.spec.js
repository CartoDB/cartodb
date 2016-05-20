var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var AddGroupUsersView = require('../../../../../../javascripts/cartodb/common/dialogs/add_group_users/add_group_users_view');

describe('common/dialogs/add_group_users/add_group_users_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 123,
      base_url: 'https://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        id: 'o1',
        owner: {
          id: 123
        }
      }
    });
    this.orgUsers = this.user.organization.users;
    spyOn(this.orgUsers, 'excludeCurrentUser').and.callThrough();
    spyOn(this.orgUsers, 'fetch').and.callThrough();
    this.orgUsers.sync = function(a,b,opts) {
      opts.success && opts.success({
        users: [
          {
            id: 'abc-123',
            username: 'paco'
          },
          {
            id: 'abc-456',
            username: 'pepe'
          }
        ],
        total_entries: 2,
        total_user_entries: 2
      })
    };

    this.group = new cdb.admin.Group({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'u1',
        username: 'pachi'
      }]
    });

    this.view = new AddGroupUsersView({
      group: this.group,
      orgUsers: this.orgUsers
    });
    this.view.render();
  });

  afterEach(function() {
    this.view.clean();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should include current user', function() {
    expect(this.orgUsers.excludeCurrentUser).toHaveBeenCalledWith(false);
  });

  describe('when view is cleaned', function() {
    beforeEach(function() {
      spyOn(this.orgUsers, 'restoreExcludeCurrentUser').and.callThrough();
      spyOn(this.view, 'elder');
      this.view.clean();
    });

    it('should restore orgUsers', function() {
      expect(this.orgUsers.restoreExcludeCurrentUser).toHaveBeenCalled();
    });

    it('should call parent clean', function() {
      expect(this.view.elder).toHaveBeenCalledWith('clean');
    });
  });

  it('should fetch org users', function() {
    expect(this.orgUsers.fetch).toHaveBeenCalled();
  });

  it('should render the users', function() {
    expect(this.innerHTML()).toContain('pepe');
    expect(this.innerHTML()).toContain('paco');
  });

  it('should disable ok btn', function() {
    expect(this.view.$('.ok').hasClass('is-disabled')).toBe(true);
  });

  describe('when at least 1 user is selected', function() {
    beforeEach(function() {
      this.view.$('.OrganizationList-userLink').click();
    });

    it('should enable ok btn', function() {
      expect(this.view.$('.ok').hasClass('is-disabled')).toBe(false);
    });

    describe('when click ok', function() {
      beforeEach(function() {
        this.jqXHR = $.Deferred();
        spyOn(this.group.users, 'addInBatch').and.returnValue(this.jqXHR);
        this.view.$('.ok').click();
      });

      it('should change state to adding users', function() {
        expect(this.innerHTML()).toContain('Adding');
      });

      describe('when is saved', function() {
        beforeEach(function() {
          spyOn(this.view, 'close');
          this.jqXHR.resolve();
        });

        it('should add users to group', function() {
          expect(this.group.users.length > 0).toBe(true);
        });

        it('should close modal', function() {
          expect(this.view.close).toHaveBeenCalled();
        });
      });

      describe('when fail', function() {
        beforeEach(function() {
          this.jqXHR.reject();
        });

        it('should show generic error', function() {
          expect(this.innerHTML()).toContain('error');
        });
      });
    });
  });
});

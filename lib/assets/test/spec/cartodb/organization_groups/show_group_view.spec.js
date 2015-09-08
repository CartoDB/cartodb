var $ = require('jquery');
var cdb = require('cartodb.js');
var ShowGroupView = require('../../../../javascripts/cartodb/organization_groups/show_group_view');
var AddGroupUsersView = require('../../../../javascripts/cartodb/common/dialogs/add_group_users/add_group_users_view.js');

describe('organization_groups/show_group_view', function() {

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

    spyOn(AddGroupUsersView.prototype, 'initialize').and.callThrough();

    this.view = new ShowGroupView({
      group: this.group,
      orgUsers: this.user.organization.users
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should not open dialog to add users just yet', function() {
    expect(AddGroupUsersView.prototype.initialize).not.toHaveBeenCalled();
  });

  describe('when there are no users in group', function() {
    beforeEach(function() {
      this.group.users.reset();
      this.view.initialize(this.view.options);
    });

    it('should open dialog to add users right away', function() {
      expect(AddGroupUsersView.prototype.initialize).toHaveBeenCalled();
    });
  });

  describe('when click add', function() {
    beforeEach(function() {
      this.view.$('.js-add-users').click();
    });

    it('should open dialog to add users', function() {
      expect(AddGroupUsersView.prototype.initialize).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  });

});

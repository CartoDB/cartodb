var $ = require('jquery');
var cdb = require('cartodb.js');
var GroupUsersFiltersExtraView = require('../../../../../javascripts/cartodb/organization/groups_admin/group_users_filters_extra_view');
var AddGroupUsersView = require('../../../../../javascripts/cartodb/common/dialogs/add_group_users/add_group_users_view.js');

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

    this.view = new GroupUsersFiltersExtraView({
      group: this.group,
      orgUsers: this.user.organization.users
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});

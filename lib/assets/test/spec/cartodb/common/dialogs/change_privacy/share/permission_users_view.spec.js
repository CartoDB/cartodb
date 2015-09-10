var cdb = require('cartodb.js');
var PermissionUsersView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/permission_users_view.js');
var ShareModel = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_model');

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The important feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/share/permission_users_view', function() {
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

    this.organizationUsers = this.user.organization.users;
    this.organizationUsers.sync = function(a,b,opts) {
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
    this.organizationUsers.fetch();

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.viewModel = new ShareModel({
      vis: this.vis,
      organization: this.user.organization
    });

    this.view = new PermissionUsersView({
      model: this.viewModel,
      collection: this.organizationUsers,
      currentUser: this.user,
      organization: this.user.organization
    });

    spyOn(this.view, 'killEvent');
    this.view.render();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('given there is at least one dependant visualization', function() {
    beforeEach(function() {
      this.dependantUser = { id: 'abc-123' };
      this.organizationUsers.setParameters({ q: '' });
      spyOn(this.viewModel, 'usersUsingVis').and.returnValue([ this.dependantUser ]);
    });

    it('should render OK', function() {
      expect(this.view.render()).toBe(this.view);
    });

    it('should render default settings for the organization', function() {
      expect(this.innerHTML()).toContain('Default settings for your Organization');
    });

    it('should render users', function() {
      expect(this.innerHTML()).toContain('paco');
      expect(this.innerHTML()).toContain('pepe');
    });
  });
});

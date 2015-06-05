var PermissionsView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/permissions_view');
var ShareModel = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/share_model');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');

function keyPressEvent(key, metaKey) {
  var event = $.Event("keydown");
  event.which = key;
  event.keyCode = key;
  if (metaKey) {
    event.metaKey = true;
  }
  return event;
}

/**
 * Most high-fidelity details are covered in underlying collection/model, so no need to re-test that here.
 * The important feature is the interactions and that view don't throw errors on render and updates.
 */
describe('common/dialogs/change_privacy/share/permissions_view', function() {
  beforeEach(function() {

    this.user = new cdbAdmin.User({
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

    this.user.organization.users.sync = function(a,b,opts) {
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

    this.vis = new cdbAdmin.Visualization({
      type: 'derived',
      privacy: 'PUBLIC'
    });

    this.viewModel = new ShareModel({
      vis: this.vis,
      organization: this.user.organization
    });

    this.view = new PermissionsView({
      model: this.viewModel,
      currentUser: this.user,
      organization: this.user.organization
    });
    
    spyOn(this.view, 'killEvent');
    this.view.render();
    this.organizationUsers = this.user.organization.users;
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have a tabs panel', function() {
    expect(this.view._panes).not.toBeUndefined();
    expect(_.size(this.view._panes._subviews)).toBe(4);
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

  describe('searching users', function() {

    it("should show results when search is done", function() {
      this.organizationUsers.fetch();
      expect(this.innerHTML()).toContain('pepe');
      expect(this.innerHTML()).toContain('paco');
    });

    it("should show clean search button when search is done", function() {
      expect(this.view.$('.js-clean-search').css('display')).toBe('none');
      this.organizationUsers
        .setParameters({ q: 'hello' })
        .reset([]);
      expect(this.view.$('.js-clean-search').css('display')).not.toBe('none');
    });

    it("should change between panes when organization users collection is fetched", function() {
      var states = [];
      this.view._panes.bind('tabEnabled', function(name){
        states.push(name);
      });
      this.organizationUsers.fetch();
      expect(_.contains(states, 'loading')).toBeTruthy();
      expect(_.contains(states, 'users')).toBeTruthy();
    });

    it("should change pagination model when organization users collection is fetched", function() {
      var changed = false;
      this.view.paginationModel.set({
        total_count: 0,
        current_page: 1
      })
      this.organizationUsers.fetch();
      expect(this.view.paginationModel.get('total_count')).toBe(2);
    });

    it("should fetch a new page of organization users when pagination model changes its current_page", function() {
      expect(this.organizationUsers.getParameter('page')).toBe(1);
      var states = [];
      spyOn(this.organizationUsers,'fetch');
      this.view.paginationModel.set({
        current_page: 2
      });
      expect(this.organizationUsers.fetch).toHaveBeenCalled();
      expect(this.organizationUsers.getParameter('page')).toBe(2);
    });

    it("should hide 'default for organization' view when a search is run", function() {
      this.organizationUsers.setParameters({
        q: 'hello'
      }).fetch();
      expect(this.view.$el.html()).not.toContain('Default settings for your Organization');
    });

    it("should show no-results block when search is empty", function() {
      this.organizationUsers.total_user_entries = 0;
      this.organizationUsers.reset([]);
      var activePane = this.view._panes.getActivePane();
      expect(activePane.$el.html()).toContain('No results');
    });

    it('should update the search value when a search is submitted', function() {
      this.view.$('.js-search-input').val('pepe');
      this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ENTER));
      expect(this.organizationUsers.getSearch()).toEqual('pepe');
    });

    it('should clear the search when users clicks X', function() {
      this.organizationUsers.setParameters({ q: 'pepe' });
      this.view.$('.js-clean-search').click();
      expect(this.organizationUsers.getSearch()).toEqual('');
    });

    it('should clear the search when user hits ESCAPE', function() {
      this.organizationUsers.setParameters({ q: 'pepe' });
      this.view.$('.js-search-input').trigger(keyPressEvent($.ui.keyCode.ESCAPE));
      expect(this.organizationUsers.getSearch()).toEqual('');
    });

  });
});

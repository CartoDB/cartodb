var cdb = require('cartodb.js');
var GroupHeaderView = require('../../../../javascripts/cartodb/organization_groups/group_header_view');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe('organization_groups/group_header_view', function() {

  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'http://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        owner: {
          id: 123
        }
      }
    });

    var groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });

    this.router = new Router({
      rootUrl: new cdb.common.Url({
        base_url: 'http://cartodb.com/user/paco/organization/groups'
      }),
      groups: groups
    });

    this.setupView = function() {
      this.group = groups.fetchGroup();

      spyOn(GroupHeaderView.prototype, 'initialize').and.callThrough();
      this.view = new GroupHeaderView({
        router: this.router,
        group: this.group
      });
      this.view.render();
    };
  });

  describe('when group is new', function() {
    beforeEach(function() {
      this.setupView();
    });

    it('should render the fallback text as title', function() {
      expect(this.view.$('h3').text()).toEqual('Create new group');
    });

    it('should not render the menu', function() {
      expect(this.innerHTML()).not.toContain('Users');
      expect(this.innerHTML()).not.toContain('Settings');
    });

    it("should not have leaks", function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when group already exist', function() {
    beforeEach(function() {
      this.setupView();
      this.group.set({
        id: 'g1',
        display_name: 'my group'
      });
    });

    it('should render the group display name as title', function() {
      expect(this.view.$('h3').text()).toEqual('my group');
    });

    it('should render the menu', function() {
      expect(this.innerHTML()).toContain('Users');
      expect(this.innerHTML()).toContain('Settings');
    });

    it('should only render users count if has any', function() {
      expect(this.innerHTML()).not.toContain('0 Users');
      this.group.users.reset([{}, {}, {}]);
      expect(this.innerHTML()).toContain('3 Users');
    });

    it("should not have leaks", function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function() {
    this.view.clean();
  });

});

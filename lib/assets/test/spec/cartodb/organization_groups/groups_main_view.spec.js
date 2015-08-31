var $ = require('jquery');
var cdb = require('cartodb.js');
var GroupsMainView = require('../../../../javascripts/cartodb/organization_groups/groups_main_view');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe('organization_groups/groups_main_view', function() {

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

    this.groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
    this.router = new Router({
      rootUrl: new cdb.common.Url({
        base_url: 'http://cartodb.com/user/paco/organization/groups'
      }),
      groups: this.groups
    });

    this.view = new GroupsMainView({
      el: $('<div><div class="js-content"></div></div>'),
      user: user,
      router: this.router,
      groups: this.groups
    });
    this.view.render();
  });

  it('should render the default view', function() {
    expect(this.innerHTML()).toContain('Create new group');
  });

  describe('when router calls routeToGroupsIndex', function() {
    beforeEach(function() {
      spyOn(this.groups, 'fetch');
      this.router.routeToGroupsIndex();
    });

    it('should fetch groups', function() {
      expect(this.groups.fetch).toHaveBeenCalled();
    });

    it('should render groups index', function() {
      expect(this.innerHTML()).toContain('Groups');
    });
  });

  describe('when router calls routeToCreateGroup', function() {
    beforeEach(function() {
      this.router.routeToCreateGroup();
    });

    it('should render create form', function() {
      var $input = this.view.$('input');
      expect(this.view.$('input').length).toBeGreaterThan(0);
      expect($input.val().length).toEqual(0);
    });
  });

  describe('when router calls routeToEditGroup', function() {
    beforeEach(function() {
      this.groups.add({
        id: 'g1',
        display_name: 'bampadam'
      });
      this.router.routeToEditGroup('g1');
    });

    it('should set group id on router model', function() {
      expect(this.router.model.get('groupId')).toEqual('g1');
    });

    it('should render edit form', function() {
      var $input = this.view.$('input');
      expect($input.length).toBeGreaterThan(0);
      expect($input.val().length).toBeGreaterThan(0);
    });
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});

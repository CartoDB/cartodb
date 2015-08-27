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

    var groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
    var router = new Router({
      rootUrl: new cdb.common.Url({
        base_url: 'http://cartodb.com/user/paco/organization/groups'
      }),
      groups: groups
    });

    this.view = new GroupsMainView({
      el: $('<div><div class="js-content"></div></div>'),
      user: user,
      router: router,
      groups: groups
    });
    this.view.render();
  });

  it('should render the default view', function() {
    expect(this.innerHTML()).toContain('Create new group');
  });

  it('should change view when router model changes', function() {
    this.view.options.router.model.set('view', 'editGroup');
    expect(this.innerHTML()).not.toContain('Create new group');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});

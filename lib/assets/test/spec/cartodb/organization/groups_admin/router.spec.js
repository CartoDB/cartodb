var cdb = require('cartodb.js');
var Router = require('../../../../../javascripts/cartodb/organization/groups_admin/router');

describe("organization/groups_admin/router", function() {
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
      user: user,
      rootUrl: user.viewUrl().organization().groups(),
      groups: this.groups
    });
  });

  describe('.normalizeFragmentOrUrl', function() {
    it('should return the normalized pathname for URLs matching current scope', function() {
      expect(this.router.normalizeFragmentOrUrl('http://cartodb.com/user/paco/organization/groups/new')).toEqual('/new');
      expect(this.router.normalizeFragmentOrUrl('http://cartodb.com/user/paco/organization/groups/edit/123')).toEqual('/edit/123');
    });

    it('should return full URL for non-matching URLs', function() {
      expect(this.router.normalizeFragmentOrUrl('http://cartodb.com/user/paco/somewhere/else')).toEqual('http://cartodb.com/user/paco/somewhere/else');
    });
  });

  it('should render a generic loading view for starters', function() {
    var view = this.router.model.get('view');
    view.render();
    expect(this.innerHTML(view)).toContain('Loading view');
  });
});

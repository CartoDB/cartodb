var cdb = require('cartodb.js-v3');
var Router = require('../../../../../javascripts/cartodb/organization/groups_admin/router');
var FlashMessageModel = require('../../../../../javascripts/cartodb/organization/flash_message_model');

describe('organization/groups_admin/router', function () {
  beforeEach(function () {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'https://carto.com/user/paco',
      username: 'paco',
      organization: {
        owner: {
          id: 123
        }
      },
      org_admin: true
    });
    this.groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });
    this.flashMessageModel = new FlashMessageModel();

    this.router = new Router({
      user: user,
      flashMessageModel: this.flashMessageModel,
      rootUrl: user.viewUrl().organization().groups(),
      groups: this.groups
    });
  });

  describe('.normalizeFragmentOrUrl', function () {
    it('should return the normalized pathname for URLs matching current scope', function () {
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/organization/groups/new')).toEqual('/new');
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/organization/groups/edit/123')).toEqual('/edit/123');
    });

    it('should return full URL for non-matching URLs', function () {
      expect(this.router.normalizeFragmentOrUrl('https://carto.com/user/paco/somewhere/else')).toEqual('https://carto.com/user/paco/somewhere/else');
    });
  });

  it('should render a generic loading view for starters', function () {
    var view = this.router.model.get('view');
    view.render();
    expect(this.innerHTML(view)).toContain('Loading view');
  });
});

var cdb = require('cartodb.js');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe("organization_groups/router", function() {
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
    this.router = new Router({
      rootUrl: user.viewUrl().organization().groups()
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
});

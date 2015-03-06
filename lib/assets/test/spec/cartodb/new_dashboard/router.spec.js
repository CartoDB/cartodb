var Router = require('../../../../javascripts/cartodb/new_dashboard/router');

describe("new_dashboard/router", function() {
  beforeEach(function() {
    var baseUrl = 'http://paco.cartodb.com';
    var user = new cdb.admin.User({
      base_url: this.baseUrl,
      username: 'paco'
    });
    this.dashboardUrl = user.viewUrl().dashboard();
    this.router = new Router({
      baseUrl: baseUrl,
      dashboardUrl: this.dashboardUrl
    });
  });

  it('should have created a router model with dashboardUrl', function() {
    expect(this.router.model.get('dashboardUrl')).toBe(this.dashboardUrl);
  });

  describe('.currentUrl', function() {
    it('should return the root URL of the current dashboard base on current state', function() {
      this.router.model.set('content_type', 'datasets');
      expect(this.router.currentUrl().toString()).toEqual('http://paco.cartodb.com/dashboard/datasets');

      this.router.model.set('content_type', 'maps');
      expect(this.router.currentUrl().toString()).toEqual('http://paco.cartodb.com/dashboard/maps');
    });
  });
});

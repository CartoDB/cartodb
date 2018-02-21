var Backbone = require('backbone');
var Router = require('dashboard/common/router-dashboard');
var UserModel = require('dashboard/data/user-model');

describe('dashboard/router', function () {
  beforeEach(function () {
    var baseUrl = 'http://paco.carto.com';
    var user = new UserModel({
      base_url: baseUrl,
      username: 'paco'
    }, {
      configModel: new Backbone.Model()
    });
    var dashboardUrl = user.viewUrl().dashboard();
    this.router = new Router({
      baseUrl: baseUrl,
      dashboardUrl: dashboardUrl
    });
  });

  it('should have created a router model with dashboardUrl', function () {
    expect(this.router.model.get('dashboardUrl')).toBe(this.dashboardUrl);
  });

  describe('.currentDashboardUrl', function () {
    it('should return the root URL of the current content type the dashboard is on', function () {
      this.router.model.set('content_type', 'datasets');
      expect(this.router.currentDashboardUrl().toString()).toEqual('http://paco.carto.com/dashboard/datasets');

      this.router.model.set('content_type', 'maps');
      expect(this.router.currentDashboardUrl().toString()).toEqual('http://paco.carto.com/dashboard/maps');
    });
  });

  describe('.currentDashboardUrl', function () {
    it('should return URL to current content type', function () {
      expect(this.router.currentDashboardUrl().toString()).toEqual('http://paco.carto.com/dashboard/datasets');
      this.router.model.set('content_type', 'maps');
      expect(this.router.currentDashboardUrl().toString()).toEqual('http://paco.carto.com/dashboard/maps');
    });
  });

  describe('.currentUrl', function () {
    beforeEach(function () {
      this.router.model.set({
        content_type: 'maps',
        shared: 'only',
        page: 123
      });
    });

    it('should return URL to current state', function () {
      expect(this.router.currentUrl().toString()).toEqual('http://paco.carto.com/dashboard/maps/shared/123');
    });
  });
});

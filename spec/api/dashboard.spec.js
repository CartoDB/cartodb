var Backbone = require('backbone');
var Dashboard = require('../../src/api/dashboard');
var DashboardView = require('../../src/dashboard-view');
var URLHelper = require('../../src/api/url-helper');
describe('dashboard', function () {
  beforeEach(function () {
    this.dashboard = new Dashboard();
  });

  it('should not return state query if there aren\'t new states', function () {
    spyOn(this.dashboard, 'getState').and.returnValue({});
    spyOn(URLHelper, 'getLocalURL').and.returnValue('https://manolo.com/');
    expect(this.dashboard.getDashboardURL()).toEqual('https://manolo.com/');
  });

  it('should return state query if there are states', function () {
    spyOn(this.dashboard, 'getState').and.returnValue({1: {pinned: true}});
    spyOn(URLHelper, 'getLocalURL').and.returnValue('https://manolo.com/');
    expect(this.dashboard.getDashboardURL().indexOf('https://manolo.com/')).not.toBeLessThan(0);
  });

  it('url should resolve to correct state', function () {
    var url = 'http://localhost:9002/examples/populated-places-vector.html?state=%257B%25221%2522%253A%257B%2522collapsed%2522%253Atrue%257D%252C%25223%2522%253A%257B%2522collapsed%2522%253Atrue%257D%252C%25225%2522%253A%257B%2522autoStyle%2522%253Atrue%257D%257D';
    spyOn(URLHelper, 'getLocalURL').and.returnValue(url);
    var correctState = { 1: { collapsed: true }, 3: { collapsed: true }, 5: { autoStyle: true } };
    expect(URLHelper.getStateFromCurrentURL()).toEqual(correctState);
  });

  it('should return dashboard view', function () {
    var view = new DashboardView({
      widgets: new Backbone.Collection(),
      model: new cdb.core.Model({
        renderMenu: true
      })
    });
    spyOn(this.dashboard, 'getView').and.returnValue(view);
    expect(this.dashboard.getView().render().el).toBeDefined();
    expect(this.dashboard.getView().render().$('.js-map-wrapper').length).toBe(1);
  });
});

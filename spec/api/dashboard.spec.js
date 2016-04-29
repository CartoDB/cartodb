var Dashboard = require('../../src/api/dashboard');
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
});

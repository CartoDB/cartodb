var Backbone = require('backbone');
var Dashboard = require('../../../../javascripts/deep-insights/api/dashboard');
var DashboardView = require('../../../../javascripts/deep-insights/dashboard-view');
var URLHelper = require('../../../../javascripts/deep-insights/api/url-helper');
var cdb = require('internal-carto.js');

describe('api/dashboard', function () {
  beforeEach(function () {
    spyOn(Dashboard.prototype, 'onDataviewsFetched').and.callThrough();
    var widgetsCollection = new Backbone.Collection();
    widgetsCollection.hasInitialState = function () {};
    widgetsCollection.initialState = function () {};
    var widgets = {
      _widgetsCollection: widgetsCollection
    };
    var dashboardParameter = new Backbone.Model();
    dashboardParameter.widgets = widgets;
    dashboardParameter.vis = new Backbone.Model();
    dashboardParameter.vis.map = new Backbone.Model({
      zoom: 5,
      center: [24.4, 43.7]
    });
    dashboardParameter.areWidgetsInitialised = function () {};

    this.dashboard = new Dashboard(dashboardParameter);
  });

  it('should add bind when dataviews are fetched', function () {
    expect(Dashboard.prototype.onDataviewsFetched).toHaveBeenCalled();
  });

  describe('onDataviewsFetched', function () {
    it('should trigger the callback if widgets are initialized', function () {
      spyOn(this.dashboard._dashboard, 'areWidgetsInitialised').and.returnValue(true);
      var callback = jasmine.createSpy('callback');
      this.dashboard.onDataviewsFetched(callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should trigger the callback when dataviews are fetched if widgets are not initialized yet', function () {
      spyOn(this.dashboard._dashboard, 'areWidgetsInitialised').and.returnValue(false);
      var callback = jasmine.createSpy('callback');
      this.dashboard.onDataviewsFetched(callback);
      expect(callback).not.toHaveBeenCalled();
      this.dashboard._dashboard.vis.trigger('dataviewsFetched');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('onStateChanged', function () {
    it('should call onDataviewsFetched function with the proper callback', function () {
      var callback = jasmine.createSpy('callback');
      this.dashboard.onStateChanged(callback);
      expect(this.dashboard.onDataviewsFetched).toHaveBeenCalled();
    });

    it('should call _bindChange function with all dataviews are fetched', function () {
      spyOn(this.dashboard, '_bindChange');
      Dashboard.prototype.onDataviewsFetched.and.callFake(function (callback) {
        callback();
      });
      var callback = jasmine.createSpy('callback');
      this.dashboard.onStateChanged(callback);
      expect(this.dashboard._bindChange).toHaveBeenCalledWith(callback);
    });
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

  it('url should resolve to empty state if state query is empty', function () {
    var url = 'http://localhost:9002/examples/populated-places-vector.html?state=';
    spyOn(URLHelper, 'getLocalURL').and.returnValue(url);
    expect(URLHelper.getStateFromCurrentURL()).toEqual({});
  });

  it('url should resolve to empty state if state query is null', function () {
    var url = 'http://localhost:9002/examples/populated-places-vector.html?state';
    spyOn(URLHelper, 'getLocalURL').and.returnValue(url);
    expect(URLHelper.getStateFromCurrentURL()).toEqual({});
  });

  it('url should work with bounding box', function () {
    var url = 'http://localhost:9002/examples/populated-places-vector.html?state=%7B%22map%22%3A%7B%22ne%22%3A%5B-22.91792293614603%2C-205.83984375%5D%2C%22sw%22%3A%5B77.8418477505252%2C10.8984375%5D%7D%2C%22widgets%22%3A%7B%22a7b718f0-23db-4b4c-a52f-d38aeab268c0%22%3A%7B%22acceptedCategories%22%3A%5B%22Populated+place%22%5D%7D%2C%22060ba59d-2e0e-46f9-9735-b9c107930f99%22%3A%7B%22normalized%22%3Atrue%2C%22min%22%3A1189104.3%2C%22max%22%3A5945917.5%7D%7D%7D';
    spyOn(URLHelper, 'getLocalURL').and.returnValue(url);
    expect(URLHelper.getStateFromURL(url).map).toEqual({
      ne: [-22.91792293614603, -205.83984375],
      sw: [77.8418477505252, 10.8984375]
    });
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

  it('state should return zoom and center', function () {
    this.dashboard._dashboard.vis.map.getViewBounds = function () {
      return [[-22.91792293614603, -205.83984375], [77.8418477505252, 10.8984375]];
    };

    var state = this.dashboard.getMapState();
    expect(state.zoom).toBeDefined();
    expect(state.center).toBeDefined();
    expect(state.ne).toBeDefined();
    expect(state.sw).toBeDefined();
    expect(state.zoom).toBe(5);
    expect(state.center).toEqual([24.4, 43.7]);
  });
});

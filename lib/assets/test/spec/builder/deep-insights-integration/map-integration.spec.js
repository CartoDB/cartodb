var _ = require('underscore');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var MapIntegration = require('builder/deep-insights-integration/map-integration');
var AppNotifications = require('builder/app-notifications');

describe('deep-insights-integrations/map-integration', function () {
  var mapElement;

  beforeAll(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });
  });

  beforeEach(function (done) {
    jasmine.Ajax.install();
    AppNotifications.init();

    // Mock Map instantiation response
    jasmine.Ajax.stubRequest(new RegExp(/api\/v1\/map/)).andReturn({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      responseText: '{ "layergroupid": "123456789", "metadata": { "layers": [] } }'
    });

    var onDashboardCreated = function (dashboard) {
      var fakeObjects = deepInsightsIntegrationSpecHelpers.createFakeObjects(dashboard);
      _.extend(this, fakeObjects);

      spyOn(this.diDashboardHelpers.getDashboard(), 'onStateChanged').and.callThrough();
      spyOn(this.stateDefinitionModel, 'updateState');

      // Track map integration
      this.integration = MapIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        editorModel: this.editorModel,
        mapDefinitionModel: this.mapDefinitionModel,
        stateDefinitionModel: this.stateDefinitionModel,
        visDefinitionModel: this.visDefinitionModel
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._mapDefinitionModel.off();
    this.integration._map.off();
    this.integration._vis.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
    AppNotifications.off();
  });

  it('mapViewSizeChanged', function () {
    var map = this.diDashboardHelpers.visMap();
    spyOn(map, 'getMapViewSize').and.returnValue({
      x: 120,
      y: 133
    });

    spyOn(this.mapDefinitionModel, 'setMapViewSize').and.callThrough();

    map.trigger('mapViewSizeChanged');
    expect(this.mapDefinitionModel.setMapViewSize).toHaveBeenCalled();
    expect(this.mapDefinitionModel.getMapViewSize()).toEqual({
      x: 120,
      y: 133
    });
  });

  describe('when vis reloads', function () {
    it('should increment changes', function () {
      this.diDashboardHelpers.getMap().trigger('reload');
      expect(this.visDefinitionModel.get('visChanges')).toBe(1);
    });
  });

  describe('visMetadata', function () {
    beforeEach(function () {
      spyOn(this.mapDefinitionModel, 'setImageExportMetadata');
      spyOn(this.mapDefinitionModel, 'setStaticImageURLTemplate');
    });

    it('should update vis metadata when state changes', function () {
      this.diDashboardHelpers.getDashboard()._dashboard.vis.trigger('dataviewsFetched');
      this.diDashboardHelpers.visMap().set('center', [10, 20]);
      expect(this.mapDefinitionModel.setImageExportMetadata).toHaveBeenCalled();
      expect(this.mapDefinitionModel.setStaticImageURLTemplate).toHaveBeenCalled();
    });

    it('update vis metadata when vis reload', function () {
      this.diDashboardHelpers.getMap().trigger('reload');
      expect(this.mapDefinitionModel.setImageExportMetadata).toHaveBeenCalled();
      expect(this.mapDefinitionModel.setStaticImageURLTemplate).toHaveBeenCalled();
    });
  });

  describe('max/min zoom changes', function () {
    beforeEach(function () {
      this.diDashboardHelpers.visMap().set({
        minZoom: 1,
        maxZoom: 20,
        zoom: 12
      });
      this.mapDefinitionModel.set({
        minZoom: 0,
        maxZoom: 15
      });
      // Avoid HTTP requests setting img src to nothing
      this.diDashboardHelpers.getDashboard()._dashboard.dashboardView.$('img').attr('src', '');
    });

    it('should change max and min zoom of the map if changes in map-definition-model', function () {
      expect(this.diDashboardHelpers.visMap().get('minZoom')).toBe(0);
      expect(this.diDashboardHelpers.visMap().get('maxZoom')).toBe(15);
    });

    it('should change map zoom if maxZoom is not as high as the current one', function () {
      expect(this.diDashboardHelpers.visMap().get('zoom')).toBe(12);
      this.mapDefinitionModel.set({
        minZoom: 0,
        maxZoom: 9
      });
      // Avoid HTTP requests setting img src to nothing
      this.diDashboardHelpers.getDashboard()._dashboard.dashboardView.$('img').attr('src', '');
      expect(this.diDashboardHelpers.visMap().get('zoom')).toBe(9);
    });
  });

  describe('legends option', function () {
    it('when activating legends', function () {
      var vis = this.diDashboardHelpers.getMap();

      this.mapDefinitionModel.set({legends: true});
      expect(vis.settings.get('showLegends')).toBe(true);
      this.mapDefinitionModel.set({legends: false});
      expect(vis.settings.get('showLegends')).toBe(false);
    });
  });

  describe('scrollwheel option', function () {
    it('when activating scrollwheel', function () {
      var map = this.diDashboardHelpers.visMap();
      spyOn(map, 'enableScrollWheel');
      spyOn(map, 'disableScrollWheel');

      this.mapDefinitionModel.set({scrollwheel: !this.mapDefinitionModel.get('scrollwheel')});
      this.mapDefinitionModel.set({scrollwheel: !this.mapDefinitionModel.get('scrollwheel')});

      expect(map.enableScrollWheel).toHaveBeenCalled();
      expect(map.disableScrollWheel).toHaveBeenCalled();
    });
  });

  describe('stateDefinitionModel', function () {
    beforeEach(function () {
      // All "widgets dataviews" fetched, ready to listen state changes
      this.diDashboardHelpers.getDashboard()._dashboard.vis.trigger('dataviewsFetched');
    });

    it('should be bind to state changes', function () {
      expect(this.diDashboardHelpers.getDashboard().onStateChanged).toHaveBeenCalled();
    });

    it('should change state model when there is any state map change from DI', function () {
      expect(this.diDashboardHelpers.getDashboard().onStateChanged).toHaveBeenCalled();
      this.diDashboardHelpers.visMap().set('center', [10, 20]);
      expect(this.stateDefinitionModel.updateState).toHaveBeenCalled();
    });

    it('should change state model when there is any state widget change from DI', function () {
      expect(this.diDashboardHelpers.getDashboard().onStateChanged).toHaveBeenCalled();
      // Simulate a widget change
      this.diDashboardHelpers.getDashboard()._dashboard.widgets._widgetsCollection.trigger('change');
      expect(this.stateDefinitionModel.updateState).toHaveBeenCalled();
    });

    it('should set bounds in CARTO.js map when state triggers a "boundsSet" event', function () {
      var bounds = [ 808 ];
      spyOn(this.diDashboardHelpers, 'setBounds');
      this.stateDefinitionModel.setBounds(bounds);
      expect(this.diDashboardHelpers.setBounds).toHaveBeenCalledWith(bounds);
    });
  });

  describe('edition option', function () {
    it('when changing edition', function () {
      spyOn(this.diDashboardHelpers, 'forceResize');
      var checked = this.editorModel.get('edition');
      this.editorModel.set({ edition: !checked });
      expect(this.diDashboardHelpers.forceResize).toHaveBeenCalled();
    });
  });

  describe('when vis error:limit', function () {
    it('should add the error to AppNotifications', function () {
      spyOn(AppNotifications, 'addNotification');
      var error = { type: 'test', message: 'some message' };
      this.diDashboardHelpers.visMap().trigger('error:limit', error);

      expect(AppNotifications.addNotification).toHaveBeenCalledWith(error);
    });
  });
});

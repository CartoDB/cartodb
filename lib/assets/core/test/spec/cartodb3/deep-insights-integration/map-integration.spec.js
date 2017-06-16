var _ = require('underscore');
// var $ = require('jquery');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var MapIntegration = require('../../../../javascripts/cartodb3/deep-insights-integration/map-integration');

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

    // Mock Map instantiation response
    jasmine.Ajax.stubRequest(new RegExp(/api\/v1\/map/)).andReturn({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      responseText: '{ "layergroupid": "123456789", "metadata": { "layers": [] } }'
    });

    var onDashboardCreated = function (dashboard) {
      var fakeObjects = deepInsightsIntegrationSpecHelpers.createFakeObjects(dashboard);
      _.extend(this, fakeObjects);

      // Track map integration
      MapIntegration.track({
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
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
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
});

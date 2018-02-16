var _ = require('underscore');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var DIDashboardHelpers = require('builder/deep-insights-integration/deep-insights-helpers');

/**
 *  Tests to check if CARTO.js and Deep-insights.js helpers/API keep working as expected
 *  within our deep-insights-integration proxy class
 */

describe('deep-insights-integrations/deep-insights-helpers', function () {
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

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    var onCreateFakeDashboard = function (dashboard) {
      this.deepInsightsDashboard = dashboard;
      this.diDashboardHelpers = new DIDashboardHelpers(dashboard);
      done();
    }.bind(this);

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onCreateFakeDashboard);
  });

  it('should provide CARTO.js vis map', function () {
    expect(this.diDashboardHelpers.visMap()).toEqual(jasmine.any(Object));
  });

  it('should provide the CARTO.js map collections and attributes', function () {
    spyOn(this.deepInsightsDashboard, 'getMap');
    this.diDashboardHelpers.getMap();
    expect(this.deepInsightsDashboard.getMap).toHaveBeenCalled();
  });

  it('should provide a method for moving CARTO.js layers', function () {
    spyOn(this.deepInsightsDashboard.getMap().map, 'moveCartoDBLayer');
    this.diDashboardHelpers.moveCartoDBLayer(0, 1);
    expect(this.deepInsightsDashboard.getMap().map.moveCartoDBLayer).toHaveBeenCalledWith(0, 1);
  });

  it('should provide a way to reload CARTO.js map', function () {
    spyOn(this.deepInsightsDashboard, 'reloadMap');
    this.diDashboardHelpers.reloadMap();
    expect(this.deepInsightsDashboard.reloadMap).toHaveBeenCalled();
  });

  it('should let invalidate CARTO.js map', function () {
    spyOn(this.deepInsightsDashboard.getMap(), 'reload');
    this.diDashboardHelpers.invalidateMap();
    expect(this.deepInsightsDashboard.getMap().reload).toHaveBeenCalled();
  });

  it('should provide a way to forceResize CARTO.js map', function () {
    spyOn(this.deepInsightsDashboard, 'forceResize');
    this.diDashboardHelpers.forceResize();
    expect(this.deepInsightsDashboard.forceResize).toHaveBeenCalled();
  });

  it('should set CARTO.js map bounds', function () {
    spyOn(this.deepInsightsDashboard._dashboard.vis.map, 'setBounds');
    this.diDashboardHelpers.setBounds([]);
    expect(this.deepInsightsDashboard._dashboard.vis.map.setBounds).toHaveBeenCalledWith(jasmine.any(Object));
  });

  it('should return CARTO.js analysis node if id is provided', function () {
    spyOn(this.deepInsightsDashboard.getMap().analysis, 'findNodeById');
    this.diDashboardHelpers.getAnalysisByNodeId('a1');
    expect(this.deepInsightsDashboard.getMap().analysis.findNodeById).toHaveBeenCalledWith('a1');
  });

  it('should return CARTO.js analyses collection', function () {
    spyOn(this.deepInsightsDashboard.getMap().analysis, 'findNodeById');
    this.diDashboardHelpers.getAnalysisByNodeId('a1');
    expect(this.deepInsightsDashboard.getMap().analysis.findNodeById).toHaveBeenCalledWith('a1');
  });

  it('should return CARTO.js layer if id is provided', function () {
    spyOn(this.deepInsightsDashboard.getMap().map, 'getLayerById');
    this.diDashboardHelpers.getLayer('a');
    expect(this.deepInsightsDashboard.getMap().map.getLayerById).toHaveBeenCalledWith('a');
  });

  it('should return CARTO.js layers collection', function () {
    expect(this.diDashboardHelpers.getLayers()).toEqual(jasmine.any(Object));
  });

  it('should return CARTO.js widget if id is provided', function () {
    spyOn(this.deepInsightsDashboard, 'getWidget');
    this.diDashboardHelpers.getWidget('hello');
    expect(this.deepInsightsDashboard.getWidget).toHaveBeenCalledWith('hello');
  });

  it('should return CARTO.js widgets collection', function () {
    spyOn(this.deepInsightsDashboard, 'getWidgets');
    this.diDashboardHelpers.getWidgets();
    expect(this.deepInsightsDashboard.getWidgets).toHaveBeenCalled();
  });

  it('should return CARTO.js overlays collection', function () {
    var overlaysCollection = this.diDashboardHelpers._deepInsightsDashboard.getMap().overlaysCollection;
    expect(this.diDashboardHelpers.getOverlays()).toEqual(overlaysCollection);
  });

  it('should provide the internal deep-insights dashboard', function () {
    expect(this.diDashboardHelpers.getDashboard()).toEqual(this.deepInsightsDashboard);
  });

  afterEach(function () {
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });
});

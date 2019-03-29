var _ = require('underscore');
var WidgetsIntegration = require('builder/deep-insights-integration/widgets-integration');
var AnalysesIntegration = require('builder/deep-insights-integration/analyses-integration');
var DeepInsightsIntegrations = require('builder/deep-insights-integrations');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration/deep-insights-integration-spec-helpers');

describe('deep-insights-integrations/dii', function () {
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

      this.deepInsightsIntegrations = new DeepInsightsIntegrations({
        onboardings: this.onboardings,
        userModel: this.userModel,
        deepInsightsDashboard: dashboard,
        analysisDefinitionsCollection: this.analysisDefinitionsCollection,
        analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
        layerDefinitionsCollection: this.layerDefinitionsCollection,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        widgetDefinitionsCollection: this.widgetDefinitionsCollection,
        overlayDefinitionsCollection: this.overlayDefinitionsCollection,
        visDefinitionModel: this.visDefinitionModel,
        mapDefinitionModel: this.mapDefinitionModel,
        stateDefinitionModel: this.stateDefinitionModel,
        mapModeModel: this.mapModeModel,
        configModel: this.configModel,
        editorModel: this.editorModel,
        editFeatureOverlay: this.editFeatureOverlay
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

  it('should set converters when basemap changes', function () {
    spyOn(this.mapDefinitionModel, 'setConverters');
    this.layerDefinitionsCollection.trigger('baseLayerChanged');
    expect(this.mapDefinitionModel.setConverters).toHaveBeenCalled();
  });

  it('should analyse definition node when new layer is created', function () {
    spyOn(AnalysesIntegration, 'analyseDefinitionNode');
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'integration-test',
      kind: 'carto',
      options: {
        sql: 'SELECT * FROM bar',
        cartocss: 'CARTO_CSS',
        source: 'a0',
        table_name: 'bar',
        table_name_alias: 'My BAR'
      },
      legends: {}
    }, { at: 1 });
    expect(AnalysesIntegration.analyseDefinitionNode).toHaveBeenCalled();
  });

  it('should manage time-series in case layer has changed', function () {
    var firstLayer = this.layerDefinitionsCollection.at(0);
    spyOn(WidgetsIntegration, 'manageTimeSeriesForTorque');
    firstLayer.set('infowindow', {whatever: 'whatever'});
    expect(WidgetsIntegration.manageTimeSeriesForTorque).toHaveBeenCalledWith(firstLayer);
  });
});

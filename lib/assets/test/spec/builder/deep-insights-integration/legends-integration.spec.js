var _ = require('underscore');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var LegendsIntegration = require('builder/deep-insights-integration/legends-integration');
var LegendDefinitionModel = require('builder/data/legends/legend-base-definition-model');

describe('deep-insights-integrations/legends-integration', function () {
  var mapElement;

  beforeAll(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    spyOn(_, 'delay').and.callFake(function (func) {
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

      this.bubble = jasmine.createSpyObj('bubble', ['show', 'hide', 'set', 'reset']);
      this.choropleth = jasmine.createSpyObj('choropleth', ['show', 'hide', 'set', 'reset']);

      spyOn(this.diDashboardHelpers, 'getLayer').and.returnValue({
        legends: {
          bubble: this.bubble,
          choropleth: this.choropleth
        }
      });

      spyOn(LegendDefinitionModel.prototype, 'save');

      // Track map integration
      this.integration = LegendsIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        legendDefinitionsCollection: this.legendDefinitionsCollection
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._legendDefinitionsCollection.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });

  it('should hide legend when a legend def model deleted', function () {
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    var legendDedfModel = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'choropleth');
    this.legendDefinitionsCollection.remove(legendDedfModel);
    expect(this.choropleth.hide).toHaveBeenCalled();
  });

  it('should update legend when a legend def model update', function () {
    var layerDefModel = this.layerDefinitionsCollection.at(0);
    var legendDedfModel = this.legendDefinitionsCollection.findByLayerDefModelAndType(layerDefModel, 'choropleth');
    legendDedfModel.setAttributes({title: 'Wadus'});
    expect(this.choropleth.set).toHaveBeenCalled();
  });
});

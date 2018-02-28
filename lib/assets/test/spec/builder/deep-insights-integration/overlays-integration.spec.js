var _ = require('underscore');
var Backbone = require('backbone');
var deepInsightsIntegrationSpecHelpers = require('./deep-insights-integration-spec-helpers');
var OverlaysIntegration = require('builder/deep-insights-integration/overlays-integration');

describe('deep-insights-integrations/overlays-integration', function () {
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

      // Track map integration
      this.integration = OverlaysIntegration.track({
        diDashboardHelpers: this.diDashboardHelpers,
        overlayDefinitionsCollection: this.overlayDefinitionsCollection
      });

      done();
    }.bind(this);

    mapElement = deepInsightsIntegrationSpecHelpers.createFakeDOMElement();

    deepInsightsIntegrationSpecHelpers.createFakeDashboard(mapElement, onDashboardCreated);
  });

  afterEach(function () {
    this.integration._overlayDefinitionsCollection.off();
    this.integration = null;
    document.body.removeChild(mapElement);
    jasmine.Ajax.uninstall();
  });

  it('should add overlay to CDB overlays collection when a new one is created', function () {
    expect(this.diDashboardHelpers.getOverlays().size()).toBe(1);
    var overlayModel = new Backbone.Model({ id: 'hello', type: 'search' });
    this.overlayDefinitionsCollection.add(overlayModel);
    expect(this.diDashboardHelpers.getOverlays().size()).toBe(2);
    expect(this.diDashboardHelpers.getOverlays().at(1).id).toBe('hello');
  });

  it('should remove overlay from CDB overlays collection when one is removed', function () {
    expect(this.diDashboardHelpers.getOverlays().size()).toBe(1);
    var overlayModel = new Backbone.Model({ id: 'hello', type: 'search' });
    this.overlayDefinitionsCollection.add(overlayModel);
    expect(this.diDashboardHelpers.getOverlays().size()).toBe(2);
    this.overlayDefinitionsCollection.remove(overlayModel);
    expect(this.diDashboardHelpers.getOverlays().size()).toBe(1);
  });
});

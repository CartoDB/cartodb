var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var GoogleMapsMapView = require('../../../../src/geo/gmaps/gmaps-map-view');
var GMapsLayerViewFactory = require('../../../../src/geo/gmaps/gmaps-layer-view-factory');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var MockFactory = require('../../../helpers/mockFactory');
var SharedTestsForTorqueLayer = require('../shared-tests-for-torque-layer');
var torque = require('torque.js');
var createEngine = require('../../fixtures/engine.fixture.js');

describe('geo/gmaps/gmaps-torque-layer-view', function () {
  beforeEach(function () {
    var container = $('<div>').css('height', '200px');
    var engineMock = createEngine();
    this.map = new Map(null, {
      layersFactory: {}
    });
    spyOn(this.map, 'trigger');
    this.view = new GoogleMapsMapView({
      el: container,
      mapModel: this.map,
      engine: new Backbone.Model(),
      layerViewFactory: new GMapsLayerViewFactory(),
      layerGroupModel: new Backbone.Model(),
      showLimitErrors: false
    });

    this.model = new TorqueLayer({
      type: 'torque',
      source: MockFactory.createAnalysisModel({ id: 'a0' }),
      cartocss: '#test {}',
      'torque-steps': 100
    }, { engine: engineMock });
    spyOn(torque, 'GMapsTorqueLayer').and.callThrough();
    this.map.addLayer(this.model);
    this.view = this.view._layerViews[this.model.cid];
  });

  SharedTestsForTorqueLayer.call(this);

  it('should apply TorqueLayer initialize method on the extended view with a bunch of attrs', function () {
    expect(torque.GMapsTorqueLayer).toHaveBeenCalled();

    var attrs = torque.GMapsTorqueLayer.calls.argsFor(0)[0];
    expect(attrs.cartocss).toEqual(jasmine.any(String));
  });

  describe('when GMapsTorqueLayer triggers tileError', function () {
    it('should trigger error:limit in mapModel if showLimitErrors is true', function () {
      this.view.showLimitErrors = true;
      this.view.nativeTorqueLayer.fire('tileError');
      var calls = this.map.trigger.calls.all();
      var types = calls.map(function (call) {
        return call.args[0];
      });
      expect(types).toContain('error:limit');
    });

    it('should not trigger error:limit in mapModel if showLimitErrors is false', function () {
      this.view.nativeTorqueLayer.fire('tileError');
      var calls = this.map.trigger.calls.all();
      var types = calls.map(function (call) {
        return call.args[0];
      });
      expect(types).not.toContain('error:limit');
    });
  });
});

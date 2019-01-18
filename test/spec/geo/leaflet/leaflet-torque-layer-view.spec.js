/* global L */
var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var LeafletLayerViewFactory = require('../../../../src/geo/leaflet/leaflet-layer-view-factory');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var MockFactory = require('../../../helpers/mockFactory');
var createEngine = require('../../fixtures/engine.fixture.js');
var SharedTestsForTorqueLayer = require('../shared-tests-for-torque-layer');

describe('geo/leaflet/leaflet-torque-layer-view', function () {
  var engineMock;

  beforeEach(function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    engineMock = createEngine();
    this.map = new Map(null, {
      layersFactory: {}
    });
    spyOn(this.map, 'trigger');
    this.mapView = new LeafletMapView({
      el: container,
      mapModel: this.map,
      engine: new Backbone.Model(),
      layerViewFactory: new LeafletLayerViewFactory(),
      layerGroupModel: new Backbone.Model(),
      showLimitErrors: false
    });
    this.mapView.render();

    spyOn(L.TorqueLayer.prototype, 'initialize').and.callThrough();

    this.model = new TorqueLayer({
      source: MockFactory.createAnalysisModel({ id: 'a0' }),
      cartocss: 'Map {}',
      dynamic_cdn: 'dynamic-cdn-value'
    }, { engine: engineMock });
    this.map.addLayer(this.model);
    this.view = this.mapView._layerViews[this.model.cid];
  });

  SharedTestsForTorqueLayer.call(this);

  it('should reuse layer view', function () {
    this.view.check = 'testing';
    var newLayer = new TorqueLayer({
      source: MockFactory.createAnalysisModel({ id: 'a0' }),
      cartocss: 'Map {}',
      dynamic_cdn: 'dynamic-cdn-value'
    }, {
      engine: engineMock
    });
    this.map.layers.reset([ newLayer ]);

    expect(this.mapView._layerViews[newLayer.cid].model).toEqual(newLayer);
    expect(this.mapView._layerViews[newLayer.cid].check).toEqual('testing');
  });

  it('should apply Leaflet TorqueLayer initialize method on the extended view with a bunch of attrs', function () {
    expect(L.TorqueLayer.prototype.initialize).toHaveBeenCalled();

    var attrs = L.TorqueLayer.prototype.initialize.calls.argsFor(0)[0];
    expect(attrs.cartocss).toEqual(jasmine.any(String));
    expect(attrs.dynamic_cdn).toEqual('dynamic-cdn-value');
    expect(attrs.instanciateCallback).toEqual(jasmine.any(Function));
  });

  it("should update providers's templateURL when urls change", function () {
    this.model.set('tileURLTemplates', [
      'http://pepe.carto.com/{z}/{x}/{y}.torque',
      'http://juan.carto.com/{z}/{x}/{y}.torque'
    ]);

    expect(this.view.leafletLayer.provider.templateUrl).toEqual('http://pepe.carto.com/{z}/{x}/{y}.torque');
  });

  describe('when LeafletTorqueLayer triggers tileError', function () {
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

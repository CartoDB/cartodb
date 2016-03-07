/* global L */
var $ = require('jquery');
var Map = require('../../../../src/geo/map');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var LeafletLayerViewFactory = require('../../../../src/geo/leaflet/leaflet-layer-view-factory');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var SharedTestsForTorqueLayer = require('../shared-tests-for-torque-layer');

describe('geo/leaflet/leaflet-torque-layer', function () {
  beforeEach(function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    this.map = new Map();
    this.mapView = new LeafletMapView({
      el: container,
      map: this.map,
      layerViewFactory: new LeafletLayerViewFactory()
    });

    spyOn(L.TorqueLayer.prototype, 'initialize').and.callThrough();

    var model = new TorqueLayer({
      type: 'torque',
      sql: 'select * from table',
      cartocss: '#test {}',
      dynamic_cdn: 'dynamic-cdn-value'
    });
    this.map.addLayer(model);
    this.view = this.mapView._layerViews[model.cid];
  });

  SharedTestsForTorqueLayer.call(this);

  it('should reuse layer view', function () {
    expect(this.view instanceof L.TorqueLayer).toEqual(true);

    this.view.check = 'testing';
    var newLayer = this.view.model.clone();
    newLayer.set({ sql: 'select * from table', cartocss: '#test {}' });
    this.map.layers.reset([newLayer]);

    expect(this.mapView._layerViews[newLayer.cid] instanceof L.TorqueLayer).toEqual(true);
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
});

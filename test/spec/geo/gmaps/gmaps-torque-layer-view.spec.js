/* global torque */
var $ = require('jquery');
var GMapsLayerViewFactory = require('../../../../src/geo/gmaps/gmaps-layer-view-factory');
var SharedTestsForTorqueLayer = require('../shared-tests-for-torque-layer');

describe('geo/gmaps/gmaps-torque-layer-view', function () {
  beforeEach(function () {
    var container = $('<div>').css('height', '200px');
    var map = new cdb.geo.Map();
    var mapView = new cdb.geo.GoogleMapsMapView({
      el: container,
      map: map,
      layerViewFactory: new GMapsLayerViewFactory()
    });

    var model = new cdb.geo.TorqueLayer({
      type: 'torque',
      sql: 'select * from table',
      cartocss: '#test {}',
      'torque-steps': 100
    });
    spyOn(torque, 'GMapsTorqueLayer').and.callThrough();
    map.addLayer(model);
    this.view = mapView.layers[model.cid];
  });

  it('should apply TorqueLayer initialize method on the extended view with a bunch of attrs', function () {
    expect(torque.GMapsTorqueLayer).toHaveBeenCalled();

    var attrs = torque.GMapsTorqueLayer.calls.argsFor(0)[0];
    expect(attrs.cartocss).toEqual(jasmine.any(String));
  });

  SharedTestsForTorqueLayer.call(this);
});

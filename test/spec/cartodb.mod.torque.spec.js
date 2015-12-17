var torque = require('../../src/cartodb.mod.torque');
require('leaflet').noConflict();

describe('torque', function () {
  it('should set a window.torque object', function () {
    expect(torque).toBeDefined();
    expect(window.torque).toBe(torque);
  });

  it('should modify the window.cartodb object', function () {
    expect(window.cartodb).toEqual(jasmine.any(Object));

    var cdb = window.cartodb;
    expect(cdb.geo).toEqual(jasmine.any(Object));

    expect(cdb.geo.GMapsTorqueLayerView).toEqual(jasmine.any(Function));
    expect(cdb.geo.LeafletTorqueLayer).toEqual(jasmine.any(Function));

    expect(cdb.geo.ui).toEqual(jasmine.any(Object));
  });
});

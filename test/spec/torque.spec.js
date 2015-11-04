var torque = require('cdb/torque');

describe('torque', function() {
  it('should set a window.torque object', function() {
    expect(torque).toBeDefined();
    expect(window.torque).toBe(torque);
  });

  it('should modify the window.cdb object', function() {
    expect(window.cdb).toEqual(jasmine.any(Object));

    var cdb = window.cdb;
    expect(cdb.geo).toEqual(jasmine.any(Object));

    expect(cdb.geo.GMapsTorqueLayerView).toEqual(jasmine.any(Function));
    expect(cdb.geo.LeafletTorqueLayer).toEqual(jasmine.any(Function));

    expect(cdb.geo.ui).toEqual(jasmine.any(Object));
    expect(cdb.geo.ui.TimeSlider).toEqual(jasmine.any(Function));
  });
});

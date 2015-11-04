var $ = require('jquery');
var GMapsTorqueLayerView = require('cdb/geo/gmaps/gmaps-torque-layer-view');

describe('geo/gmaps/gmaps-torque-layer-view', function() {
  beforeEach(function() {
    var container = $('<div>').css('height', '200px');
    this.map = new cdb.geo.Map();
    this.mapView = new cdb.geo.GoogleMapsMapView({
      el: container,
      map: this.map
    });

    var layerURL = 'http://localhost/{s}/light_nolabels/{z}/{x}/{y}.png';
    this.layer = new cdb.geo.TileLayer({ urlTemplate: layerURL });
  });

  describe('when a layer is changed to torque type', function() {
    beforeEach(function() {
      jasmine.clock().install()

      this.map.addLayer(this.layer);
      this.layer.set({'type': 'torque', 'cartocss': 'Map{ -torque-frame-count: 10; }'});

      jasmine.clock().tick(2000);
    });

    it('should switch layer', function() {
      expect(this.mapView.layers[this.layer.cid] instanceof GMapsTorqueLayerView).toBe(true);
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });
});

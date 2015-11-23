var $ = require('jquery');
var LeafletTorqueLayer = require('cdb/geo/leaflet/leaflet-torque-layer');

describe('geo/leaflet/leaflet-torque-layer', function() {
  beforeEach(function() {
    var container = $('<div>').css({
        'height': '200px',
        'width': '200px'
    });
    this.map = new cdb.geo.Map();
    this.mapView = new cdb.geo.LeafletMapView({
      el: container,
      map: this.map
    });

    var layerURL = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png';
    this.layer = new cdb.geo.TileLayer({ urlTemplate: layerURL });
  });

  it('should reuse layer view', function() {
    var layer1 = new cdb.geo.TorqueLayer({ type: 'torque', sql: 'select * from table', cartocss: '#test {}' });
    this.map.addLayer(layer1);

    expect(this.mapView.layers[layer1.cid] instanceof L.TorqueLayer).toEqual(true);

    this.mapView.layers[layer1.cid].check = 'testing';
    var newLayer = layer1.clone();
    newLayer.set({ sql: 'select * from table', cartocss: '#test {}' });
    this.map.layers.reset([newLayer]);

    expect(this.mapView.layers[newLayer.cid] instanceof L.TorqueLayer).toEqual(true);
    expect(this.mapView.layers[newLayer.cid].model).toEqual(newLayer)
    expect(this.mapView.layers[newLayer.cid].check).toEqual('testing');
  });
});

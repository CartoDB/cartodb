var $ = require('jquery');
var SharedTestsForTorqueLayer = require('../shared-tests-for-torque-layer');

describe('geo/gmaps/gmaps-torque-layer-view', function () {
  beforeEach(function () {
    var container = $('<div>').css('height', '200px');
    var map = new cdb.geo.Map();
    var mapView = new cdb.geo.GoogleMapsMapView({
      el: container,
      map: map
    });

    var model = new cdb.geo.TorqueLayer({
      type: 'torque',
      sql: 'select * from table',
      cartocss: '#test {}',
      'torque-steps': 100
    });
    map.addLayer(model);
    this.view = mapView.layers[model.cid];
  });

  SharedTestsForTorqueLayer.call(this);
});

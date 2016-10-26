var PolylineView = require('../../../../../src/geo/leaflet/geometries/polyline-view');
var Polyline = require('../../../../../src/geo/geometry-models/polyline');
var SharedTestsForPathViews = require('./shared-tests-for-path-views');

describe('src/geo/leaflet/geometries/polyline-view.js', function () {
  beforeEach(function () {
    this.geometry = new Polyline(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });

    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);
    this.geometryView = new PolylineView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForPathViews.call(this);
});

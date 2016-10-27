var PolygonView = require('../../../../../src/geo/leaflet/geometries/polygon-view');
var Polygon = require('../../../../../src/geo/geometry-models/polygon');
var SharedTestsForPathViews = require('./shared-tests-for-path-views');

describe('src/geo/leaflet/geometries/polygon-view.js', function () {
  beforeEach(function () {
    this.geometry = new Polygon(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });

    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);
    this.geometryView = new PolygonView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForPathViews.call(this);
});

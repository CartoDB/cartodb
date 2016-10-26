var PolygonView = require('../../../../../src/geo/leaflet/geometries/polygon-view.js');
var Polygon = require('../../../../../src/geo/geometry-models/polygon.js');

var SharedTestsForPathViews = require('./shared-tests-for-path-views.js');
var GeoJSONHelper = require('./geojson-helper.js');

var pathToGeoJSONFunction = function (path) {
  var coords = GeoJSONHelper.convertLatLngsToGeoJSONPolygonCoords(path.getLatLngs());
  return {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'Polygon',
      'coordinates': [ coords ]
    }
  };
};

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

  SharedTestsForPathViews.call(this, pathToGeoJSONFunction);
});

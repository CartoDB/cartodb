var MultiPolylineView = require('../../../../../src/geo/leaflet/geometries/multi-polyline-view.js');
var MultiPolyline = require('../../../../../src/geo/geometry-models/multi-polyline.js');

var SharedTestsForMultiPathViews = require('./shared-tests-for-multi-path-views.js');
var GeoJSONHelper = require('./geojson-helper.js');

var multiPathToGeoJSONFunction = function (multiPath) {
  var coords = multiPath.geometries.map(function (path) {
    return GeoJSONHelper.convertLatLngsToGeoJSONPolylineCoords(path.getLatLngs());
  });
  return {
    'type': 'MultiLineString',
    'coordinates': coords
  };
};

describe('src/geo/leaflet/geometries/multi-polyline-view.js', function () {
  beforeEach(function () {
    this.geometry = new MultiPolyline(null, {
      latlngs: [
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4]
        ],
        [
          [0, 10],
          [10, 20],
          [20, 30],
          [30, 40]
        ]
      ]
    });
    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);

    this.geometryView = new MultiPolylineView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForMultiPathViews.call(this, multiPathToGeoJSONFunction);
});

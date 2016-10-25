var _ = require('underscore');
var PolylineView = require('../../../../../src/geo/leaflet/geometries/polyline-view.js');
var Polyline = require('../../../../../src/geo/geometry-models/polyline.js');

var SharedTestsForPathViews = require('./shared-tests-for-path-views.js');

var pathToGeoJSONFunction = function (path) {
  var coords = path.getLatLngs();
  coords = _.map(coords, function (lnglat) {
    return [lnglat[1], lnglat[0]];
  });

  return {
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'LineString',
      'coordinates': coords
    }
  };
};

describe('src/geo/leaflet/geometries/polyline-view.js', function () {
  beforeEach(function () {
    this.geometry = new Polyline(null, {
      latlngs: [
        [
          -1,
          1
        ],
        [
          1,
          2
        ],
        [
          3,
          4
        ]
      ]
    });

    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);
    this.geometryView = new PolylineView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForPathViews.call(this, pathToGeoJSONFunction);
});

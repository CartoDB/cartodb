var MultiPointView = require('../../../../../src/geo/leaflet/geometries/multi-point-view');
var MultiPoint = require('../../../../../src/geo/geometry-models/multi-point');
var SharedTestsForMultiGeometryViews = require('./shared-tests-for-multi-geometry-views');
var FakeLeafletMap = require('./fake-leaflet-map');

describe('src/geo/leaflet/geometries/multi-point-view.js', function () {
  beforeEach(function () {
    this.geometry = new MultiPoint(null, {
      latlngs: [
        [0, 1],
        [1, 2]
      ]
    });
    this.leafletMap = new FakeLeafletMap();

    this.geometryView = new MultiPointView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForMultiGeometryViews.call(this);

  it('should render the geometries', function () {
    expect(this.leafletMap.getMarkers().length).toEqual(2); // 2 points
  });
});

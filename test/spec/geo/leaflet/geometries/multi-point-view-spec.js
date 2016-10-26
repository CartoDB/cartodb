var MultiPointView = require('../../../../../src/geo/leaflet/geometries/multi-point-view');
var MultiPoint = require('../../../../../src/geo/geometry-models/multi-point');
var SharedTestsForMultiGeometryViews = require('./shared-tests-for-multi-geometry-views');

describe('src/geo/leaflet/geometries/multi-point-view.js', function () {
  beforeEach(function () {
    this.geometry = new MultiPoint(null, {
      latlngs: [
        [0, 1],
        [1, 2]
      ]
    });
    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);

    this.geometryView = new MultiPointView({
      model: this.geometry,
      nativeMap: this.leafletMap
    });
  });

  SharedTestsForMultiGeometryViews.call(this);

  it('should render the geometries', function () {
    expect(this.leafletMap.addLayer.calls.count()).toEqual(2); // 2 markers
  });
});

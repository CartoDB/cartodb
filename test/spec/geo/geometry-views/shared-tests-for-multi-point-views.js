var MultiPoint = require('../../../../src/geo/geometry-models/multi-point');
var SharedTestsForMultiGeometryViews = require('./shared-tests-for-multi-geometry-views');
var createMapView = require('./create-map-view');

module.exports = function (MapView, MultiPointView) {
  beforeEach(function () {
    this.geometry = new MultiPoint(null, {
      latlngs: [
        [0, 1],
        [1, 2]
      ]
    });
    this.mapView = createMapView(MapView);
    this.mapView.render();

    this.geometryView = new MultiPointView({
      model: this.geometry,
      mapView: this.mapView
    });
  });

  SharedTestsForMultiGeometryViews.call(this);

  it('should render the geometries', function () {
    expect(this.mapView.getMarkers().length).toEqual(2); // 2 points
  });
};

var MultiPolyline = require('../../../../src/geo/geometry-models/multi-polyline');
var SharedTestsForMultiGeometryViews = require('./shared-tests-for-multi-geometry-views');
var createMapView = require('./create-map-view');

module.exports = function (MapView, MultiPolylineView) {
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
    this.mapView = createMapView(MapView);
    this.mapView.render();

    this.geometryView = new MultiPolylineView({
      model: this.geometry,
      mapView: this.mapView
    });
  });

  SharedTestsForMultiGeometryViews.call(this);

  it('should render the geometries', function () {
    expect(this.mapView.getPaths().length).toEqual(2); // 2 geometries
    expect(this.mapView.getMarkers().length).toEqual(8); // 4 markers for each geometry
  });
};

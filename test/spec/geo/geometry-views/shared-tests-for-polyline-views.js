var Polyline = require('../../../../src/geo/geometry-models/polyline');
var SharedTestsForPathViews = require('./shared-tests-for-path-views');
var createMapView = require('./create-map-view');
var CoordinatesComparator = require('./coordinates-comparator');

module.exports = function (MapView, PathView) {
  SharedTestsForPathViews.call(this, Polyline, MapView, PathView);

  describe('expandable polylines', function () {
    beforeEach(function (done) {
      this.mapView = createMapView(MapView);
      this.mapView.render();

      this.geometry = new Polyline({
        editable: true,
        expandable: true
      }, {
        latlngs: [
          [0, 0], [10, 0], [10, 10], [0, 10]
        ]
      });

      this.geometryView = new PathView({
        model: this.geometry,
        mapView: this.mapView
      });

      // Listen for the map to be ready
      this.mapView.onReady(function () {
        this.geometryView.render();

        done();
      }.bind(this));
    });

    it('should render markers for each vertex, the path, and middle points', function () {
      var paths = this.mapView.getPaths();
      var markers = this.mapView.getMarkers();
      expect(paths.length).toEqual(1);
      expect(markers.length).toEqual(7); // 4 markers + 3 middle points

      // Markers
      expect(markers[0].getCoordinates()).toEqual({ lat: 0, lng: 0 });
      expect(markers[0].isDraggable()).toBe(true);

      expect(markers[1].getCoordinates()).toEqual({ lat: 10, lng: 0 });
      expect(markers[1].isDraggable()).toBe(true);

      expect(markers[2].getCoordinates()).toEqual({ lat: 10, lng: 10 });
      expect(markers[2].isDraggable()).toBe(true);

      expect(markers[3].getCoordinates()).toEqual({ lat: 0, lng: 10 });
      expect(markers[3].isDraggable()).toBe(true);

      // Middle points
      // Coordinates have different precissions and we just check they are similar
      expect(CoordinatesComparator.areCoordinatesSimilar(
        [ markers[4].getCoordinates() ],
        [ { lat: 5, lng: 0 } ])
      ).toBeTruthy();
      expect(markers[4].isDraggable()).toBe(true);

      expect(CoordinatesComparator.areCoordinatesSimilar(
        [ markers[5].getCoordinates() ],
        [ { lat: 10, lng: 5 } ])
      ).toBeTruthy();
      expect(markers[5].isDraggable()).toBe(true);

      expect(CoordinatesComparator.areCoordinatesSimilar(
        [ markers[6].getCoordinates() ],
        [ { lat: 5, lng: 10 } ])
      ).toBeTruthy();
      expect(markers[6].isDraggable()).toBe(true);

      expect(paths[0].getCoordinates()).toEqual([
        { lat: 0, lng: 0 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
      ]);
    });

    it('should re-render middle points when map is zoomed', function () {
      spyOn(this.mapView, 'removeMarker');
      spyOn(this.mapView, 'addMarker');

      this.mapView.trigger('zoomend');

      expect(this.mapView.removeMarker.calls.count()).toEqual(3);
      expect(this.mapView.addMarker.calls.count()).toEqual(3);
    });
  });
};

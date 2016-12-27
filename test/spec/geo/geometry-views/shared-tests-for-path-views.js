var _ = require('underscore');
var Point = require('../../../../src/geo/geometry-models/point.js');
var createMapView = require('./create-map-view');
var CoordinatesComparator = require('./coordinates-comparator');

module.exports = function (Path, MapView, PathView) {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.mapView = createMapView(MapView);
    this.mapView.render();

    this.geometry = new Path(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });

    this.geometryView = new PathView({
      model: this.geometry,
      mapView: this.mapView
    });

    this.geometryView.render();
  });

  it('should render some markers and the path', function () {
    var paths = this.mapView.getPaths();
    var markers = this.mapView.getMarkers();
    expect(paths.length).toEqual(1);
    expect(markers.length).toEqual(3); // 3 markers

    expect(markers[0].getCoordinates()).toEqual({ lat: -1, lng: 1 });
    expect(markers[0].isDraggable()).toBe(false);

    expect(markers[1].getCoordinates()).toEqual({ lat: 1, lng: 2 });
    expect(markers[1].isDraggable()).toBe(false);

    expect(markers[2].getCoordinates()).toEqual({ lat: 3, lng: 4 });
    expect(markers[2].isDraggable()).toBe(false);

    expect(paths[0].getCoordinates()).toEqual([
      { lat: -1, lng: 1 }, { lat: 1, lng: 2 }, { lat: 3, lng: 4 }
    ]);
  });

  it('should not render duplicated markers', function () {
    var paths = this.mapView.getPaths();
    var markers = this.mapView.getMarkers();
    expect(paths.length).toEqual(1);
    expect(markers.length).toEqual(3); // 3 markers

    this.geometry.setCoordinates([
      [-1, 1], [1, 2], [3, 4], [-1, 1]
    ]);

    paths = this.mapView.getPaths();
    markers = this.mapView.getMarkers();
    expect(paths.length).toEqual(1);
    expect(markers.length).toEqual(4); // 4 markers
  });

  describe('when the model is updated', function () {
    describe('when a point changed', function () {
      beforeEach(function () {
        this.geometry.points.at(0).set('latlng', [ -45, 45 ]);
      });

      it("should update the path's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -45, 45 ], [ 1, 2 ], [ 3, 4 ]
        ]);
      });
    });

    describe('when points are added', function () {
      beforeEach(function () {
        this.numberOfMarkersBefore = this.mapView.getMarkers().length;
        var point = new Point({
          latlng: [
            -40,
            40
          ]
        });
        this.geometry.addPoint(point);
      });

      it("should update the path's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -40, 40 ], [ -1, 1 ], [ 1, 2 ], [ 3, 4 ]
        ]);
      });

      it('should render a new marker', function () {
        var numberOfMarkersAfter = this.mapView.getMarkers().length;

        expect(numberOfMarkersAfter).toEqual(this.numberOfMarkersBefore + 1);
      });
    });

    describe('when points are resetted,', function () {
      beforeEach(function () {
        this.geometry.setCoordinates([
          [ -10, 10 ], [ 10, 20 ], [ 30, 40 ]
        ]);
      });

      it("should update the path's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -10, 10 ], [ 10, 20 ], [ 30, 40 ]
        ]);
      });

      it('should render the right number of markers', function () {
        var numberOfMarkersAfter = this.mapView.getMarkers().length;
        expect(numberOfMarkersAfter).toEqual(3);
      });
    });
  });

  describe('when the model is removed', function () {
    it('should remove the markers and path from the map', function () {
      var paths = this.mapView.getPaths();
      var markers = this.mapView.getMarkers();
      expect(paths.length).toEqual(1);
      expect(markers.length).toEqual(3); // 3 markers

      this.geometry.remove();

      paths = this.mapView.getPaths();
      markers = this.mapView.getMarkers();
      expect(paths.length).toEqual(0);
      expect(markers.length).toEqual(0);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });

  describe('expandable paths', function () {
    beforeEach(function () {
      this.mapView = createMapView(MapView);
      this.mapView.render();

      this.geometry = new Path({
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

      this.geometryView.render();

      // Marker that we'll interact with in the tests
      this.middlePointMarker = this.mapView.findMarkerByLatLng({ lat: 5, lng: 0 });
      var markers = this.mapView.getMarkers();
      this.numberOfMarkersBefore = markers.length;
    });

    describe('when the model is removed', function () {
      it('should remove the markers, middle points, and path from the map', function () {
        var paths = this.mapView.getPaths();
        var markers = this.mapView.getMarkers();
        expect(paths.length).not.toEqual(0);
        expect(markers.length).not.toEqual(0);

        this.geometry.remove();

        paths = this.mapView.getPaths();
        markers = this.mapView.getMarkers();
        expect(paths.length).toEqual(0);
        expect(markers.length).toEqual(0);
      });
    });

    describe('when user mousedowns a middle point', function () {
      beforeEach(function () {
        expect(this.middlePointMarker.getIconURL()).toEqual(Point.MIDDLE_POINT_ICON_URL);

        this.middlePointMarker.trigger('mousedown');
      });

      it('should add a vertex to the geometry at [5, 0]', function () {
        var paths = this.mapView.getPaths();
        expect(paths.length).toEqual(1);

        // Coordinates have different precissions and we just check they are similar
        expect(CoordinatesComparator.areCoordinatesSimilar(paths[0].getCoordinates(), [
          { lat: 0, lng: 0 }, { lat: 5, lng: 0 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
        ])).toBeTruthy();
      });

      it('should change the icon of the middle point', function () {
        expect(this.middlePointMarker.getIconURL()).toEqual(Point.DEFAULT_ICON_URL);
      });

      it('should add two middle points at [2.5] and [7.5, 0]', function () {
        var markers = this.mapView.getMarkers();
        expect(markers.length).toEqual(this.numberOfMarkersBefore + 2);

        expect(this.mapView.findMarkerByLatLng({ lat: 2.5, lng: 0 })).toBeDefined();
        expect(this.mapView.findMarkerByLatLng({ lat: 7.5, lng: 0 })).toBeDefined();
      });

      it('should remove the markers, middle points, and path from the map when the model is removed', function () {
        var paths = this.mapView.getPaths();
        var markers = this.mapView.getMarkers();
        expect(paths.length).not.toEqual(0);
        expect(markers.length).not.toEqual(0);

        this.geometry.remove();

        paths = this.mapView.getPaths();
        markers = this.mapView.getMarkers();
        expect(paths.length).toEqual(0);
        expect(markers.length).toEqual(0);
      });

      describe('when user drags a middle point', function () {
        beforeEach(function () {
          // Simulate a drag and drop to [5, -5]
          spyOn(this.middlePointMarker, 'getCoordinates').and.returnValue({ lat: 5, lng: -5 });
          this.middlePointMarker.trigger('dragstart');
          this.middlePointMarker.trigger('drag');
          this.middlePointMarker.trigger('dragend');
        });

        it('should update the coordinates of the new vertex to [5, -5]', function () {
          var paths = this.mapView.getPaths();
          expect(paths.length).toEqual(1);
          expect(paths[0].getCoordinates()).toEqual([
            { lat: 0, lng: 0 }, { lat: 5, lng: -5 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
          ]);
        });

        it('should add two middle points at [2.5] and [7.5, 0]', function () {
          var markers = this.mapView.getMarkers();
          expect(markers.length).toEqual(this.numberOfMarkersBefore + 2); // Only two middle points have been added

          expect(this.mapView.findMarkerByLatLng({ lat: 2.5, lng: -2.5 })).toBeDefined();
          expect(this.mapView.findMarkerByLatLng({ lat: 7.5, lng: -2.5 })).toBeDefined();
        });
      });
    });
  });
};

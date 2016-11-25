var _ = require('underscore');
var Point = require('../../../../../src/geo/geometry-models/point.js');
var FakeLeafletMap = require('./fake-leaflet-map');

module.exports = function (PathClass, PathViewClass) {
  if (!PathClass) throw new Error('PathClass is required');
  if (!PathViewClass) throw new Error('PathViewClass is required');

  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.leafletMap = new FakeLeafletMap();

    this.geometry = new PathClass(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });

    this.geometryView = new PathViewClass({
      model: this.geometry,
      nativeMap: this.leafletMap
    });

    this.geometryView.render();
  });

  it('should render some markers and the path', function () {
    var paths = this.leafletMap.getPaths();
    var markers = this.leafletMap.getMarkers();
    expect(paths.length).toEqual(1);
    expect(markers.length).toEqual(3); // 3 markers
    expect(markers[0].getLatLng()).toEqual({ lat: -1, lng: 1 });
    expect(markers[0].options.draggable).toBe(false);
    expect(markers[1].getLatLng()).toEqual({ lat: 1, lng: 2 });
    expect(markers[1].options.draggable).toBe(false);
    expect(markers[2].getLatLng()).toEqual({ lat: 3, lng: 4 });
    expect(markers[2].options.draggable).toBe(false);
    expect(paths[0].getLatLngs()).toEqual([
      { lat: -1, lng: 1 }, { lat: 1, lng: 2 }, { lat: 3, lng: 4 }
    ]);
  });

  it('should not render duplicated markers', function () {
    var paths = this.leafletMap.getPaths();
    var markers = this.leafletMap.getMarkers();
    expect(paths.length).toEqual(1);
    expect(markers.length).toEqual(3); // 3 markers

    this.geometry.setCoordinates([
      [-1, 1], [1, 2], [3, 4], [-1, 1]
    ]);

    paths = this.leafletMap.getPaths();
    markers = this.leafletMap.getMarkers();
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

    describe('when points are added, function', function () {
      beforeEach(function () {
        var point = new Point({
          latlng: [
            -40,
            40
          ]
        });
        this.geometry.points.add(point);
      });

      it("should update the path's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -1, 1 ], [ 1, 2 ], [ 3, 4 ], [ -40, 40 ]
        ]);
      });
    });

    describe('when points are resetted, function', function () {
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
    });
  });

  describe('when the model is removed', function () {
    it('should remove the markers and path from the map', function () {
      var paths = this.leafletMap.getPaths();
      var markers = this.leafletMap.getMarkers();
      expect(paths.length).toEqual(1);
      expect(markers.length).toEqual(3); // 3 markers

      this.geometry.remove();

      paths = this.leafletMap.getPaths();
      markers = this.leafletMap.getMarkers();
      expect(paths.length).toEqual(0);
      expect(markers.length).toEqual(0);
    });

    it('should remove each point from the path', function () {
      this.geometry.points.each(function (point) {
        spyOn(point, 'remove');
      });

      this.geometry.remove();

      expect(this.geometry.points.all(function (point) {
        return point.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });

  describe('expandable paths', function () {
    beforeEach(function () {
      this.leafletMap = new FakeLeafletMap();

      this.geometry = new PathClass({
        editable: true,
        expandable: true
      }, {
        latlngs: [
          [0, 0], [10, 0], [10, 10], [0, 10]
        ]
      });

      this.geometryView = new PathViewClass({
        model: this.geometry,
        nativeMap: this.leafletMap
      });

      this.geometryView.render();

      // Marker that we'll interact with in the tests
      this.middlePointMarker = this.leafletMap.findMarkerByLatLng({ lat: 5, lng: 0 });
      var markers = this.leafletMap.getMarkers();
      this.numberOfMarkersBefore = markers.length;
    });

    describe('when the model is removed', function () {
      it('should remove the markers, middle points, and path from the map', function () {
        var paths = this.leafletMap.getPaths();
        var markers = this.leafletMap.getMarkers();
        expect(paths.length).not.toEqual(0);
        expect(markers.length).not.toEqual(0);

        this.geometry.remove();

        paths = this.leafletMap.getPaths();
        markers = this.leafletMap.getMarkers();
        expect(paths.length).toEqual(0);
        expect(markers.length).toEqual(0);
      });
    });

    describe('when user mousedowns a middle point', function () {
      beforeEach(function () {
        expect(this.middlePointMarker.options.icon.options.iconUrl).toEqual(Point.MIDDLE_POINT_ICON_URL);

        this.middlePointMarker.fire('mousedown');
      });

      it('should add a vertex to the geometry at [5, 0]', function () {
        var paths = this.leafletMap.getPaths();
        expect(paths.length).toEqual(1);
        expect(paths[0].getLatLngs()).toEqual([
          { lat: 0, lng: 0 }, { lat: 5, lng: 0 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
        ]);
      });

      it('should change the icon of the middle point', function () {
        expect(this.middlePointMarker.options.icon.options.iconUrl).toEqual(Point.DEFAULT_ICON_URL);
      });

      it('should add two middle points at [2.5] and [7.5, 0]', function () {
        var markers = this.leafletMap.getMarkers();
        expect(markers.length).toEqual(this.numberOfMarkersBefore + 2);

        expect(this.leafletMap.findMarkerByLatLng({ lat: 2.5, lng: 0 })).toBeDefined();
        expect(this.leafletMap.findMarkerByLatLng({ lat: 7.5, lng: 0 })).toBeDefined();
      });

      it('should remove the markers, middle points, and path from the map when the model is removed', function () {
        var paths = this.leafletMap.getPaths();
        var markers = this.leafletMap.getMarkers();
        expect(paths.length).not.toEqual(0);
        expect(markers.length).not.toEqual(0);

        this.geometry.remove();

        paths = this.leafletMap.getPaths();
        markers = this.leafletMap.getMarkers();
        expect(paths.length).toEqual(0);
        expect(markers.length).toEqual(0);
      });

      describe('when user drags a middle point', function () {
        beforeEach(function () {
          // Simulate a drag and drop to [5, -5]
          spyOn(this.middlePointMarker, 'getLatLng').and.returnValue({ lat: 5, lng: -5 });
          this.middlePointMarker.fire('dragstart');
          this.middlePointMarker.fire('drag');
          this.middlePointMarker.fire('dragend');
        });

        it('should add a vertex to the geometry at [5, -5]', function () {
          var paths = this.leafletMap.getPaths();
          expect(paths.length).toEqual(1);
          expect(paths[0].getLatLngs()).toEqual([
            { lat: 0, lng: 0 }, { lat: 5, lng: -5 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
          ]);
        });

        it('should add two middle points at [2.5] and [7.5, 0]', function () {
          var markers = this.leafletMap.getMarkers();
          expect(markers.length).toEqual(this.numberOfMarkersBefore + 2); // Only two middle points have been added

          expect(this.leafletMap.findMarkerByLatLng({ lat: 2.5, lng: -2.5 })).toBeDefined();
          expect(this.leafletMap.findMarkerByLatLng({ lat: 7.5, lng: -2.5 })).toBeDefined();
        });
      });
    });
  });
};

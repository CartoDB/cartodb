var PolygonView = require('../../../../../src/geo/leaflet/geometries/polygon-view');
var Polygon = require('../../../../../src/geo/geometry-models/polygon');
var SharedTestsForPathViews = require('./shared-tests-for-path-views');
var FakeLeafletMap = require('./fake-leaflet-map');

describe('src/geo/leaflet/geometries/polygon-view.js', function () {
  SharedTestsForPathViews.call(this, Polygon, PolygonView);

  describe('expandable paths', function () {
    beforeEach(function () {
      this.leafletMap = new FakeLeafletMap();

      this.geometry = new Polygon({
        editable: true,
        expandable: true
      }, {
        latlngs: [
          [0, 0], [10, 0], [10, 10], [0, 10]
        ]
      });

      this.geometryView = new PolygonView({
        model: this.geometry,
        nativeMap: this.leafletMap
      });

      this.geometryView.render();
    });

    it('should render markers for each vertex, the path, and middle points', function () {
      var paths = this.leafletMap.getPaths();
      var markers = this.leafletMap.getMarkers();
      expect(paths.length).toEqual(1);
      expect(markers.length).toEqual(8); // 4 markers + 4 middle points

      // Markers
      expect(markers[0].getLatLng()).toEqual({ lat: 0, lng: 0 });
      expect(markers[0].options.draggable).toBe(true);

      expect(markers[1].getLatLng()).toEqual({ lat: 10, lng: 0 });
      expect(markers[1].options.draggable).toBe(true);

      expect(markers[2].getLatLng()).toEqual({ lat: 10, lng: 10 });
      expect(markers[2].options.draggable).toBe(true);

      expect(markers[3].getLatLng()).toEqual({ lat: 0, lng: 10 });
      expect(markers[3].options.draggable).toBe(true);

      // Middle points
      expect(markers[4].getLatLng()).toEqual({ lat: 5, lng: 0 });
      expect(markers[4].options.draggable).toBe(true);

      expect(markers[5].getLatLng()).toEqual({ lat: 10, lng: 5 });
      expect(markers[5].options.draggable).toBe(true);

      expect(markers[6].getLatLng()).toEqual({ lat: 5, lng: 10 });
      expect(markers[6].options.draggable).toBe(true);

      expect(markers[7].getLatLng()).toEqual({ lat: 0, lng: 5 });
      expect(markers[7].options.draggable).toBe(true);

      expect(paths[0].getLatLngs()).toEqual([
        { lat: 0, lng: 0 }, { lat: 10, lng: 0 }, { lat: 10, lng: 10 }, { lat: 0, lng: 10 }
      ]);
    });
  });
});

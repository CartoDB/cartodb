var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletPolylineView = require('../../../../../src/geo/leaflet/geometries/polyline-view.js');
var SharedTestsForPolylineViews = require('../shared-tests-for-polyline-views');

describe('src/geo/geometry-views/leaflet/polyline-view.js', function () {
  SharedTestsForPolylineViews.call(this, LeafletMapView, LeafletPolylineView);
});

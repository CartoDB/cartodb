var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletMultiPolylineView = require('../../../../../src/geo/leaflet/geometries/multi-polyline-view.js');
var SharedTestsForMultiPolylineViews = require('../shared-tests-for-multi-polyline-views');

describe('src/geo/geometry-views/leaflet/multi-polyline-view.js', function () {
  SharedTestsForMultiPolylineViews.call(this, LeafletMapView, LeafletMultiPolylineView);
});

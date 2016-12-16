var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletMultiPolylineView = require('../../../../../src/geo/geometry-views/leaflet/multi-polyline-view.js');
var SharedTestsForMultiPolylineViews = require('../shared-tests-for-multi-polyline-views');

describe('src/geo/geometry-views/leaflet/multi-polyline-view.js', function () {
  SharedTestsForMultiPolylineViews.call(this, LeafletMapView, LeafletMultiPolylineView);
});

var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletPolylineView = require('../../../../../src/geo/geometry-views/leaflet/polyline-view.js');
var SharedTestsForPolylineViews = require('../shared-tests-for-polyline-views');

describe('src/geo/geometry-views/leaflet/polyline-view.js', function () {
  SharedTestsForPolylineViews.call(this, LeafletMapView, LeafletPolylineView);
});

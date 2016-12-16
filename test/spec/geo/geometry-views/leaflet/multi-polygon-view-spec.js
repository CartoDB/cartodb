var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletMultiPolygonView = require('../../../../../src/geo/geometry-views/leaflet/multi-polygon-view.js');
var SharedTestsForMultiPolygonViews = require('../shared-tests-for-multi-polygon-views');

describe('src/geo/geometry-views/leaflet/multi-polygon-view.js', function () {
  SharedTestsForMultiPolygonViews.call(this, LeafletMapView, LeafletMultiPolygonView);
});

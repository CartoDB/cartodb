var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletMultiPolygonView = require('../../../../../src/geo/leaflet/geometries/multi-polygon-view.js');
var SharedTestsForMultiPolygonViews = require('../shared-tests-for-multi-polygon-views');

describe('src/geo/geometry-views/leaflet/multi-polygon-view.js', function () {
  SharedTestsForMultiPolygonViews.call(this, LeafletMapView, LeafletMultiPolygonView);
});

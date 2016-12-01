var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletPolygonView = require('../../../../../src/geo/leaflet/geometries/polygon-view.js');
var SharedTestsForPolygonViews = require('../shared-tests-for-polygon-views');

describe('src/geo/geometry-views/leaflet/polygon-view.js', function () {
  SharedTestsForPolygonViews.call(this, LeafletMapView, LeafletPolygonView);
});

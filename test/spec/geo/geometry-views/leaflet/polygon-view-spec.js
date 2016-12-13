var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletPolygonView = require('../../../../../src/geo/geometry-views/leaflet/polygon-view.js');
var SharedTestsForPolygonViews = require('../shared-tests-for-polygon-views');

describe('src/geo/geometry-views/leaflet/polygon-view.js', function () {
  SharedTestsForPolygonViews.call(this, LeafletMapView, LeafletPolygonView);
});

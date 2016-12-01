var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletMultiPointView = require('../../../../../src/geo/leaflet/geometries/multi-point-view.js');
var SharedTestsForMultiPointViews = require('../shared-tests-for-multi-point-views');

describe('src/geo/geometry-views/leaflet/multi-point-view.js', function () {
  SharedTestsForMultiPointViews.call(this, LeafletMapView, LeafletMultiPointView);
});

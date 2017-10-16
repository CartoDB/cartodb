var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletMultiPointView = require('../../../../../src/geo/geometry-views/leaflet/multi-point-view.js');
var SharedTestsForMultiPointViews = require('../shared-tests-for-multi-point-views');

describe('src/geo/geometry-views/leaflet/multi-point-view.js', function () {
  SharedTestsForMultiPointViews.call(this, LeafletMapView, LeafletMultiPointView);
});

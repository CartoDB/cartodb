var LeafletMapView = require('../../../../../src/geo/leaflet/leaflet-map-view.js');
var LeafletPointView = require('../../../../../src/geo/geometry-views/leaflet/point-view.js');
var SharedTestsForPointViews = require('../shared-tests-for-point-views');

describe('src/geo/geometry-views/leaflet/point-view.js', function () {
  SharedTestsForPointViews.call(this, LeafletMapView, LeafletPointView);
});

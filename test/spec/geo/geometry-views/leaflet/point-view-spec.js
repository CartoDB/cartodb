var LeafletMapView = require('./leaflet-map-view-for-tests');
var LeafletPointView = require('../../../../../src/geo/leaflet/geometries/point-view.js');
var SharedTestsForPointViews = require('../shared-tests-for-point-views');

describe('src/geo/geometry-views/leaflet/point-view.js', function () {
  SharedTestsForPointViews.call(this, LeafletMapView, LeafletPointView);
});

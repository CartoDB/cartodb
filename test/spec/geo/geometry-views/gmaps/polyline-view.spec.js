var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsPolylineView = require('../../../../../src/geo/geometry-views/gmaps/polyline-view.js');
var SharedTestsForPolylineViews = require('../shared-tests-for-polyline-views');

describe('src/geo/geometry-views/gmaps/polyline-view.js', function () {
  SharedTestsForPolylineViews.call(this, GMapsMapView, GMapsPolylineView);
});

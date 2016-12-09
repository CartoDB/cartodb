var GMapsMapView = require('./gmaps-map-for-tests');
var GMapsPolylineView = require('../../../../../src/geo/gmaps/geometries/polyline-view.js');
var SharedTestsForPolylineViews = require('../shared-tests-for-polyline-views');

describe('src/geo/geometry-views/gmaps/polyline-view.js', function () {
  SharedTestsForPolylineViews.call(this, GMapsMapView, GMapsPolylineView);
});

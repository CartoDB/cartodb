var MapView = require('./fake-map-view');
var PathView = require('./fake-path-view');
var SharedTestsForPolylineViews = require('../shared-tests-for-polyline-views');

describe('src/geo/geometry-views/base/polyline-view.js', function () {
  SharedTestsForPolylineViews.call(this, MapView, PathView);
});

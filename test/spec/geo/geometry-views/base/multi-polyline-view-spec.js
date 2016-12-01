var MapView = require('./fake-map-view');
var MultiPolylineView = require('./fake-multi-path-view');
var SharedTestsForMultiPolylineViews = require('../shared-tests-for-multi-polyline-views');

describe('src/geo/geometry-views/base/multi-polyline-view.js', function () {
  SharedTestsForMultiPolylineViews.call(this, MapView, MultiPolylineView);
});

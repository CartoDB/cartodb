var MapView = require('./fake-map-view');
var MultiPolygonView = require('./fake-multi-path-view');
var SharedTestsForMultiPolygonViews = require('../shared-tests-for-multi-polygon-views');

describe('src/geo/geometry-views/base/multi-polygon-view.js', function () {
  SharedTestsForMultiPolygonViews.call(this, MapView, MultiPolygonView);
});

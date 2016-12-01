var MapView = require('./fake-map-view');
var PathView = require('./fake-path-view');
var SharedTestsForPolygonViews = require('../shared-tests-for-polygon-views');

describe('src/geo/geometry-views/base/polygon-view.js', function () {
  SharedTestsForPolygonViews.call(this, MapView, PathView);
});

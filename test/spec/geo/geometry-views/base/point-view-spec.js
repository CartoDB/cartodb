var MapView = require('./fake-map-view');
var PointView = require('./fake-point-view');
var SharedTestsForPointViews = require('../shared-tests-for-point-views');

describe('src/geo/geometry-views/base/point-view.js', function () {
  SharedTestsForPointViews.call(this, MapView, PointView);
});

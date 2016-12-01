var MapView = require('./fake-map-view');
var MultiPointView = require('./fake-multi-point-view');
var SharedTestsForMultiPointViews = require('../shared-tests-for-multi-point-views');

describe('src/geo/geometry-views/base/multi-point-view.js', function () {
  SharedTestsForMultiPointViews.call(this, MapView, MultiPointView);
});

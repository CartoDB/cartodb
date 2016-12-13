var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsMultiPointView = require('../../../../../src/geo/geometry-views/gmaps/multi-point-view.js');
var SharedTestsForMultiPointViews = require('../shared-tests-for-multi-point-views');

describe('src/geo/geometry-views/gmaps/multi-point-view.js', function () {
  SharedTestsForMultiPointViews.call(this, GMapsMapView, GMapsMultiPointView);
});

var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsPointView = require('../../../../../src/geo/geometry-views/gmaps/point-view.js');
var SharedTestsForPointViews = require('../shared-tests-for-point-views');

describe('src/geo/geometry-views/gmaps/point-view.js', function () {
  SharedTestsForPointViews.call(this, GMapsMapView, GMapsPointView);
});

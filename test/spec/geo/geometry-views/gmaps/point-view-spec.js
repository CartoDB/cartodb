var GMapsMapView = require('./gmaps-map-for-tests');
var GMapsPointView = require('../../../../../src/geo/gmaps/geometries/point-view.js');
var SharedTestsForPointViews = require('../shared-tests-for-point-views');

describe('src/geo/geometry-views/gmaps/point-view.js', function () {
  SharedTestsForPointViews.call(this, GMapsMapView, GMapsPointView);
});

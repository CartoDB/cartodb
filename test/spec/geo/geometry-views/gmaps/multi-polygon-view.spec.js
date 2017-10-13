var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsMultiPolygonView = require('../../../../../src/geo/geometry-views/gmaps/multi-polygon-view.js');
var SharedTestsForMultiPolygonViews = require('../shared-tests-for-multi-polygon-views');

describe('src/geo/geometry-views/gmaps/multi-polygon-view.js', function () {
  SharedTestsForMultiPolygonViews.call(this, GMapsMapView, GMapsMultiPolygonView);
});

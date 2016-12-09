var GMapsMapView = require('./gmaps-map-for-tests');
var GMapsMultiPolygonView = require('../../../../../src/geo/gmaps/geometries/multi-polygon-view.js');
var SharedTestsForMultiPolygonViews = require('../shared-tests-for-multi-polygon-views');

describe('src/geo/geometry-views/gmaps/multi-polygon-view.js', function () {
  SharedTestsForMultiPolygonViews.call(this, GMapsMapView, GMapsMultiPolygonView);
});

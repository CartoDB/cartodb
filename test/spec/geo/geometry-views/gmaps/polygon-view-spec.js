var GMapsMapView = require('./gmaps-map-for-tests');
var GMapsPolygonView = require('../../../../../src/geo/gmaps/geometries/polygon-view.js');
var SharedTestsForPolygonViews = require('../shared-tests-for-polygon-views');

describe('src/geo/geometry-views/gmaps/polygon-view.js', function () {
  SharedTestsForPolygonViews.call(this, GMapsMapView, GMapsPolygonView);
});

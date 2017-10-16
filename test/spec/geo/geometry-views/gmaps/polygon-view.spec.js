var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsPolygonView = require('../../../../../src/geo/geometry-views/gmaps/polygon-view.js');
var SharedTestsForPolygonViews = require('../shared-tests-for-polygon-views');

describe('src/geo/geometry-views/gmaps/polygon-view.js', function () {
  SharedTestsForPolygonViews.call(this, GMapsMapView, GMapsPolygonView);
});

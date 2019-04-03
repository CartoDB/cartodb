var GMapsMapView = require('../../../../../src/geo/gmaps/gmaps-map-view.js');
var GMapsMultiPolylineView = require('../../../../../src/geo/geometry-views/gmaps/multi-polyline-view.js');
var SharedTestsForMultiPolylineViews = require('../shared-tests-for-multi-polyline-views');

describe('src/geo/geometry-views/gmaps/multi-polygon-view.js', function () {
  SharedTestsForMultiPolylineViews.call(this, GMapsMapView, GMapsMultiPolylineView);
});

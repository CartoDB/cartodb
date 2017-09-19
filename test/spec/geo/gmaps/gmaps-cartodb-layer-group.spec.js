/* global google */
var GmapsCartoDBLayerGroupView = require('../../../../src/geo/gmaps/gmaps-cartodb-layer-group-view');
var SharedTestsForCartoDBLayerGroupViews = require('../shared-tests-for-cartodb-layer-group-views');
var FakeWax = require('../fake-wax');

GmapsCartoDBLayerGroupView.prototype.interactionClass = FakeWax;

var createLayerGroupView = function (layerGroupModel, container) {
  var gmapsMap = new google.maps.Map(container, {
    center: new google.maps.LatLng(0, 0),
    zoom: 3,
    disableDefaultUI: true,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    backgroundColor: 'white',
    tilt: 0
  });

  var layerGroupView = new GmapsCartoDBLayerGroupView(layerGroupModel, gmapsMap);
  gmapsMap.overlayMapTypes.setAt(1, layerGroupView.gmapsLayer);
  return layerGroupView;
};

var expectTileURLTemplateToMatch = function (layerGroupView, expectedTileURLTemplate) {
  expect(removeSubdomainFromTileURL(expectedTileURLTemplate)).toEqual(layerGroupView.options.tiles[0]);
};

var removeSubdomainFromTileURL = function (tileURL) {
  return tileURL.replace('{s}', '0');
};

var fireNativeEvent = function (layerGroupView, eventName) {
  layerGroupView.trigger(eventName);
};

describe('src/geo/gmaps/gmaps-cartodb-layer-group-view.js', function () {
  SharedTestsForCartoDBLayerGroupViews.call(this, createLayerGroupView, expectTileURLTemplateToMatch, fireNativeEvent);
});

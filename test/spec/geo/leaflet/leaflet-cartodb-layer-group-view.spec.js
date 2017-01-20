var L = require('leaflet');

var SharedTestsForCartoDBLayerGroupViews = require('../shared-tests-for-cartodb-layer-group-views');
var FakeWax = require('../fake-wax');

var OriginalLeafletCartoDBLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-layer-group-view');

var LeafletCartoDBLayerGroupView = OriginalLeafletCartoDBLayerGroupView.extend({
  interactionClass: FakeWax,

  initialize: function () {
    this.__templateURL = null;
    OriginalLeafletCartoDBLayerGroupView.prototype.initialize.apply(this, arguments);
  },

  setUrl: function (url) {
    this.__templateURL = url;
    OriginalLeafletCartoDBLayerGroupView.prototype.setUrl.apply(this, arguments);
  },

  getUrl: function () {
    return this.__templateURL;
  }
});

var expectTileURLTemplateToMatch = function (layerGroupView, expectedTileURLTemplate) {
  expect(layerGroupView.getUrl()).toEqual(expectedTileURLTemplate);
};

var createLayerGroupView = function (layerGroupModel, container) {
  var leafletMap = new L.Map(container, {
    center: [0, 0],
    zoom: 3
  });

  var layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModel, leafletMap);
  layerGroupView.addTo(leafletMap);
  return layerGroupView;
};

describe('src/geo/leaflet/leaflet-cartodb-layer-group-view.js', function () {
  SharedTestsForCartoDBLayerGroupViews.call(this, createLayerGroupView, expectTileURLTemplateToMatch);
});

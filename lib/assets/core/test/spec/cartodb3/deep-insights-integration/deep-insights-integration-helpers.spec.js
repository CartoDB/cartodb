var Backbone = require('backbone');
var _ = require('underscore');

module.exports = {
  createOnboardings: function () {
    return {
      create: function () {
        return {};
      }
    };
  },

  createFakeLayer: function (attrs) {
    var layer = new Backbone.Model(attrs);
    layer.isVisible = function () {
      return true;
    };
    return layer;
  },

  createFakeDashboard: function (layers) {
    var allLayersHaveIds = _.all(layers, function (layer) {
      return layer.get('id');
    });
    if (!allLayersHaveIds) {
      throw new Error('all layers in createFakeDashboard need to have an id');
    }

    var baseLayer = new Backbone.Model({
      baseType: 'wadus'
    });

    var fakeMap = new Backbone.Model();
    fakeMap.getLayerById = function (layerId) {
      return _.find(layers, function (layer) {
        return layer.get('id') === layerId;
      });
    };

    fakeMap.getBaseLayer = function () {
      return baseLayer;
    };

    fakeMap.pixelToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    fakeMap.latLngToPixel = function () {
      return { x: 100, y: 20 };
    };

    fakeMap.getMapViewSize = function () {
      return { x: 100, y: 100 };
    };

    var fakeVis = new Backbone.Model();
    fakeVis.map = fakeMap;
    fakeVis.getStaticImageURL = jasmine.createSpy('getStaticImageURL');

    var fakeDashboard = {
      widgets: {
        _widgetsCollection: new Backbone.Collection()
      }
    };

    return {
      getMap: function () {
        return fakeVis;
      },
      onStateChanged: function () {},
      _dashboard: fakeDashboard
    };
  }
}

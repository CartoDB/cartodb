var L = require('leaflet');
var carto = require('../../../../src/api/v4');

describe('src/api/v4/leaflet-layer', function () {
  var client;
  var layer;
  var leafletLayer;
  var map;
  var mapContainer;

  beforeEach(function () {
    mapContainer = document.createElement('div');
    mapContainer.id = 'map';
    document.body.appendChild(mapContainer);

    client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      username: 'cartojs-test'
    });
    map = L.map('map').setView([42.431234, -8.643616], 5);
    leafletLayer = client.getLeafletLayer();
  });

  afterEach(function () {
    document.getElementById('map').remove();
  });

  describe('addTo', function () {
    it('should add a leaflet layer to the map', function () {
      expect(countLeafletLayers(map)).toEqual(0);

      leafletLayer.addTo(map);

      expect(countLeafletLayers(map)).toEqual(1);
    });
  });

  describe('removeFrom', function () {
    it('should remove the leaflet layer from the map', function () {
      expect(countLeafletLayers(map)).toEqual(0);

      leafletLayer.addTo(map);

      expect(countLeafletLayers(map)).toEqual(1);

      leafletLayer.removeFrom(map);

      expect(countLeafletLayers(map)).toEqual(0);
    });
  });

  describe('layer events', function () {
    var spy;
    var internalEventMock;

    beforeEach(function () {
      spy = jasmine.createSpy('spy');

      leafletLayer.addTo(map);

      var source = new carto.source.SQL('foo');
      var style = new carto.style.CartoCSS('bar');
      layer = new carto.layer.Layer(source, style);

      client.addLayer(layer, { reload: false });

      internalEventMock = {
        layer: {
          id: layer.getId()
        },
        latlng: [ 10, 20 ],
        feature: { name: 'foo' }
      };
    });

    it('should trigger carto.layer.events.FEATURE_CLICKED event', function () {
      layer.on(carto.layer.events.FEATURE_CLICKED, spy);

      var expectedExternalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      leafletLayer._internalView.trigger('featureClick', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OVER event', function () {
      layer.on(carto.layer.events.FEATURE_OVER, spy);

      var expectedExternalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      leafletLayer._internalView.trigger('featureOver', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OUT featureOut events', function () {
      layer.on(carto.layer.events.FEATURE_OUT, spy);

      var expectedExternalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };
      leafletLayer._internalView.trigger('featureOut', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    describe('mouse pointer', function () {
      describe('when mousing over a feature', function () {
        it("should NOT set the mouse cursor to 'pointer' if layer doesn't have featureOverColumns or featureClickColumns", function () {
          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOver', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('');
        });

        it("should set the mouse cursor to 'pointer' if layer has setFeatureOverColumns", function () {
          layer.setFeatureOverColumns([ 'foo' ]);

          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOver', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('pointer');
        });

        it("should set the mouse cursor to 'pointer' if layer has setFeatureClickColumns", function () {
          layer.setFeatureClickColumns([ 'foo' ]);

          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOver', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('pointer');
        });

        it("should set the mouse cursor to 'pointer' if layer has overed features after a featureOut", function () {
          leafletLayer._hoveredLayers = ['L100'];

          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOut', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('pointer');
        });
      });

      describe('when mousing over NO features', function () {
        it("should set the mouse cursor to 'auto'", function () {
          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOut', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('auto');
        });
      });
    });
  });

  function countLeafletLayers (map) {
    return Object.keys(map._layers).length;
  }
});

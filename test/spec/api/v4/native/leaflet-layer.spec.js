/* global L */
var carto = require('../../../../../src/api/v4');

describe('src/api/v4/native/leaflet-layer', function () {
  var client;
  var layer;
  var leafletLayer;
  var map;

  beforeEach(function () {
    var element = document.createElement('div');
    element.id = 'map';
    document.body.appendChild(element);

    client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      username: 'cartojs-test'
    });
    map = L.map('map').setView([42.431234, -8.643616], 5);
  });

  afterEach(function () {
    document.getElementById('map').remove();
  });

  it('allows custom options', function () {
    leafletLayer = client.getLeafletLayer({ maxZoom: 10 });

    expect(leafletLayer.options.maxZoom).toBe(10);
  });

  describe('addTo', function () {
    beforeEach(function () {
      leafletLayer = client.getLeafletLayer();
    });

    it('should add a leaflet layer to the map', function () {
      expect(countLeafletLayers(map)).toEqual(0);

      leafletLayer.addTo(map);

      expect(countLeafletLayers(map)).toEqual(1);
    });
  });

  describe('removeFrom', function () {
    beforeEach(function () {
      leafletLayer = client.getLeafletLayer();
    });

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

      leafletLayer = client.getLeafletLayer();
      leafletLayer.addTo(map);

      var source = new carto.source.SQL('foo');
      var style = new carto.style.CartoCSS('bar');
      layer = new carto.layer.Layer(source, style);

      client.addLayer(layer);

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

    it('should trigger carto.layer.events.TILE_ERROR events', function () {
      layer.on(carto.layer.events.TILE_ERROR, spy);
      layer._featureClickColumns = [ 'foo' ];
      var error = {
        message: 'an error'
      };

      leafletLayer._internalView.trigger('featureError', error);

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'CartoError',
        message: 'an error'
      }));
    });

    describe('mouse pointer', function () {
      describe('when mousing over a feature', function () {
        it("should NOT set the mouse cursor to 'pointer' if layer doesn't have featureOverColumns or featureClickColumns", function () {
          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOver', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('');
        });

        it("should set the mouse cursor to 'pointer' if layer has featureOverColumns", function () {
          layer._featureOverColumns = [ 'foo' ];

          expect(map.getContainer().style.cursor).toEqual('');

          leafletLayer._internalView.trigger('featureOver', internalEventMock);

          expect(map.getContainer().style.cursor).toEqual('pointer');
        });

        it("should set the mouse cursor to 'pointer' if layer has featureClickColumns", function () {
          layer._featureClickColumns = [ 'foo' ];

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

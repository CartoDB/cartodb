/* global google */
var carto = require('../../../../../src/api/v4');

describe('src/api/v4/native/google-maps-map-type', function () {
  var client;
  var layer;
  var mapType;
  var map;

  beforeEach(function () {
    var element = document.createElement('div');
    element.id = 'map';
    document.body.appendChild(element);

    client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      username: 'cartojs-test'
    });
    map = new google.maps.Map(element);
    mapType = client.getGoogleMapsMapType(map);
  });

  afterEach(function () {
    document.getElementById('map').remove();
  });

  describe('layer events', function () {
    var spy;
    var internalEventMock;

    beforeEach(function () {
      spy = jasmine.createSpy('spy');

      map.overlayMapTypes.push(mapType);

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

      mapType._internalView.trigger('featureClick', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OVER event', function () {
      layer.on(carto.layer.events.FEATURE_OVER, spy);

      var expectedExternalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      mapType._internalView.trigger('featureOver', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OUT featureOut events', function () {
      layer.on(carto.layer.events.FEATURE_OUT, spy);

      var expectedExternalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };
      mapType._internalView.trigger('featureOut', internalEventMock);

      expect(spy).toHaveBeenCalledWith(expectedExternalEvent);
    });

    describe('mouse pointer', function () {
      describe('when mousing over a feature', function () {
        it("should NOT set the mouse cursor to 'pointer' if layer doesn't have featureOverColumns or featureClickColumns", function () {
          expect(map.get('draggableCursor')).not.toBeDefined();

          mapType._internalView.trigger('featureOver', internalEventMock);

          expect(map.get('draggableCursor')).not.toBeDefined();
        });

        it("should set the mouse cursor to 'pointer' if layer has featureOverColumns", function () {
          layer._featureOverColumns = [ 'foo' ];

          expect(map.get('draggableCursor')).not.toBeDefined();

          mapType._internalView.trigger('featureOver', internalEventMock);

          expect(map.get('draggableCursor')).toEqual('pointer');
        });

        it("should set the mouse cursor to 'pointer' if layer has featureClickColumns", function () {
          layer._featureClickColumns = [ 'foo' ];

          expect(map.get('draggableCursor')).not.toBeDefined();

          mapType._internalView.trigger('featureOver', internalEventMock);

          expect(map.get('draggableCursor')).toEqual('pointer');
        });

        it("should set the mouse cursor to 'pointer' if layer has overed features after a featureOut", function () {
          mapType._hoveredLayers = ['L100'];

          expect(map.get('draggableCursor')).not.toBeDefined();

          mapType._internalView.trigger('featureOut', internalEventMock);

          expect(map.get('draggableCursor')).toEqual('pointer');
        });
      });

      describe('when mousing over NO features', function () {
        it("should set the mouse cursor to 'auto'", function () {
          expect(map.get('draggableCursor')).not.toBeDefined();

          mapType._internalView.trigger('featureOut', internalEventMock);

          expect(map.get('draggableCursor')).toEqual('auto');
        });
      });
    });
  });
});

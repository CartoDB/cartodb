/* global L */
/* global google */
var _ = require('underscore');
var carto = require('../../../../src/api/v4');
var LeafletLayer = require('../../../../src/api/v4/native/leaflet-layer');
var GoogleMapsMapType = require('../../../../src/api/v4/native/google-maps-map-type');
var Engine = require('../../../../src/engine');
var Events = require('../../../../src/api/v4/events');

describe('api/v4/client', function () {
  var client;

  beforeEach(function () {
    client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      serverUrl: 'https://cartojs-test.carto.com',
      username: 'cartojs-test'
    });
  });

 describe('constructor', function () {
    it('should build a new client', function () {
      expect(client).toBeDefined();
      expect(client.getLayers()).toEqual([]);
    });

    it('should autogenerate the carto url when is not given', function () {
      client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });

      expect(client._engine._windshaftSettings.urlTemplate).toEqual('https://cartojs-test.carto.com');
    });

    it('should accept a ipv4/user/{username} as a valid serverURL', function () {
      expect(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test',
          serverUrl: '192.168.0.1/user/cartojs-test'
        });
      }).not.toThrow();
    });

    it('should throw when serverURL is an ip adress with no /user/{username}', function () {
      expect(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test',
          serverUrl: '192.168.0.1'
        });
      }).toThrow();
    });

    it('should throw when serverURL is an invalid ip adress with no /user/{username}', function () {
      expect(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test',
          serverUrl: '192.168.1/user/cartojs-test'
        });
      }).toThrow();
    });

    it('should throw when serverURL is an ip adress with no /user/{username}', function () {
      expect(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test',
          serverUrl: '192.168.1'
        });
      }).toThrow();
    });

    describe('error handling', function () {
      describe('apiKey', function () {
        it('should throw a descriptive error when apikey is not given', function () {
          expect(function () {
            new carto.Client({ username: "cartojs-test" }); // eslint-disable-line
          }).toThrowError('apiKey property is required.');
        });

        it('should throw a descriptive error when apikey is not a string', function () {
          expect(function () {
            new carto.Client({ apiKey: 1234, username: "cartojs-test" }); // eslint-disable-line
          }).toThrowError('apiKey property must be a string.');
        });

        it('should throw a descriptive error when apikey is not a string', function () {
          expect(function () {
            new carto.Client({ apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18' }); // eslint-disable-line
          }).toThrowError('username property is required.');
        });
      });

      describe('username', function () {
        it('should throw a descriptive error when username is not a string', function () {
          expect(function () {
            new carto.Client({ apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18', username: 1234 }); // eslint-disable-line
          }).toThrowError('username property must be a string.');
        });
      });

      describe('serverUrl', function () {
        it('should throw a descriptive error when serverUrl is given and is not valid', function () {
          expect(function () {
            // eslint-disable-next-line
            new carto.Client({
              apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
              username: 'cartojs-test',
              serverUrl: 'invalid-url'
            });
          }).toThrowError('serverUrl is not a valid URL.');
        });

        it("should throw a descriptive error when serverUrl doesn't match the username", function () {
          expect(function () {
            // eslint-disable-next-line
            new carto.Client({
              apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
              username: 'cartojs-test',
              serverUrl: 'https://invald-username.carto.com'
            });
          }).toThrowError("serverUrl doesn't match the username.");
        });
      });
    });
  });

  describe('.addLayer', function () {
    var source;
    var style;
    var layer;

    beforeEach(function () {
      source = new carto.source.Dataset('ne_10m_populated_places_simple', {
        id: 'a0'
      });
      style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      layer = new carto.layer.Layer(source, style, {});
    });

    it('should add a new layer', function () {
      client.addLayer(layer);

      expect(client.getLayers()[0]).toEqual(layer);
    });

    it('should add a new layer triggering a reload cycle by default', function (done) {
      spyOn(client._engine, 'reload').and.callThrough();

      client.addLayer(layer).then(function () {
        expect(client._engine.reload).toHaveBeenCalled();
        expect(client._engine.reload.calls.count()).toEqual(1);
        done();
      });
    });

    it('should return a rejected promise when some error happened', function (done) {
      var errorMock = new Error('Error-Mock');
      spyOn(client._engine, 'reload').and.returnValue(
        Promise.reject(errorMock)
      );

      client.addLayer(layer).catch(function (error) {
        expect(error.message).toEqual(errorMock.message);
        done();
      });
    });

    it('should return a significative error when layer parameter is not a valid layer', function () {
      expect(function () {
        client.addLayer([]);
      }).toThrowError('The given object is not a layer.');
    });

    it('should throw a descriptive error when two layers with the same id are added', function () {
      expect(function () {
        client.addLayer(layer);
        client.addLayer(
          new carto.layer.Layer(source, style, { id: layer.getId() })
        );
      }).toThrowError('A layer with the same ID already exists in the client.');
    });
  });

  describe('.addLayers', function () {
    it('should add a layers array', function () { });
    it('should add a layer array triggering ONE reload cycle by default', function () { });
    it('should add a layers array without triggering a reload cycle when opts.reload is false', function () { });
    it('should return a rejected promise when some error happened', function () { });
  });

  describe('.getLayers', function () {
    it('should return an empty array when there are no layers', function () {
      expect(client.getLayers()).toEqual([]);
    });
    xit('should return the layers stored in the client', function (done) {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layer = new carto.layer.Layer(source, style, {});
      client.addLayer(layer).then(function () {
        expect(client.getLayers()[0]).toEqual(layer);
        done();
      });
    });
  });

  describe('.removeLayer', function () {
    it('should throw a descriptive error when the parameter is invalid', function () {
      expect(function () {
        client.removeLayer({});
      }).toThrowError('The given object is not a layer.');
    });

    it('¿should throw a descriptive error when layer is not in the client?', function () {
      pending('We should decide if this makes sense.');
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layer = new carto.layer.Layer(source, style, {});

      expect(function () {
        client.removeLayer(layer);
      }).toThrowError('The layer is not in the client');
    });

    it('should remove the layer when is in the client', function () {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layer = new carto.layer.Layer(source, style, {});
      client.addLayer(layer);

      expect(client.getLayers().length).toEqual(1);

      client.removeLayer(layer);

      expect(client.getLayers().length).toEqual(0);
    });
  });

  describe('.removeLayers', function () {
    it('must remove all layers', function () {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layerA = new carto.layer.Layer(source, style, {});
      var layerB = new carto.layer.Layer(source, style, {});
      var layerC = new carto.layer.Layer(source, style, {});
      client.addLayers([layerA, layerB, layerC]);

      expect(client.getLayers().length).toEqual(3);

      client.removeLayers(client.getLayers());

      expect(client.getLayers().length).toEqual(0);
    });
  });

  describe('.removeDataview', function () {
    var categoryDataview, populationDataview;

    beforeEach(function () {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      categoryDataview = new carto.dataview.Category(source, 'adm0name', {
        limit: 10,
        operation: carto.operation.SUM,
        operationColumn: 'pop_max'
      });

      populationDataview = new carto.dataview.Category(source, 'adm1name', {
        limit: 10,
        operation: carto.operation.SUM,
        operationColumn: 'pop_max'
      });

      client.addDataview(categoryDataview);
      client.addDataview(populationDataview);

      spyOn(client._engine, 'removeDataview');
      spyOn(categoryDataview, 'disable');
      spyOn(client, '_reload');
    });

    it('removes the dataview', function () {
      expect(client._dataviews.length).toBe(2);

      client.removeDataview(categoryDataview);

      expect(client._dataviews.length).toBe(1);
    });

    it('disables the dataview', function () {
      client.removeDataview(categoryDataview);

      expect(client._engine.removeDataview).toHaveBeenCalled();
    });

    it('triggers a reload cycle', function () {
      client.removeDataview(categoryDataview);

      expect(client._reload).toHaveBeenCalled();
    });
  });

  describe('.moveLayer', function () {
    it('should throw a descriptive error when the parameter is invalid', function () {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layer = new carto.layer.Layer(source, style, {});

      expect(function () {
        client.moveLayer({}, 0);
      }).toThrowError('The given object is not a layer.');

      expect(function () {
        client.moveLayer(layer, false);
      }).toThrowError('index property must be a number.');

      expect(function () {
        client.moveLayer(layer, 1234);
      }).toThrowError('index is out of range.');
    });

    it('should move the layer when is in the client', function () {
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
      var layer0 = new carto.layer.Layer(source, style, {});
      var layer1 = new carto.layer.Layer(source, style, {});

      client.addLayers([layer0, layer1]);
      expect(client.getLayers()[0]).toEqual(layer0);
      expect(client.getLayers()[1]).toEqual(layer1);

      client.moveLayer(layer0, 1);
      expect(client.getLayers()[1]).toEqual(layer0);
      expect(client.getLayers()[0]).toEqual(layer1);
    });
  });

  describe('.getLeafletLayer', function () {
    var leafletLayer;

    beforeEach(function () {
      leafletLayer = client.getLeafletLayer();
    });

    it('should return an instance of LeafletLayer', function () {
      expect(leafletLayer instanceof LeafletLayer).toBe(true);
    });

    it('should return the same object', function () {
      expect(leafletLayer === client.getLeafletLayer()).toBe(true);
    });

    it('should return a L.TileLayer', function () {
      expect(leafletLayer instanceof L.TileLayer).toBe(true);
    });

    it('should have the OpenStreetMap / Carto attribution', function () {
      expect(leafletLayer.getAttribution()).toBe(
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
      );
    });

    it('should throw an error if Leaflet is not loaded', function () {
      var L = _.clone(window.L);

      window.L = undefined;
      expect(function () {
        client.getLeafletLayer();
      }).toThrowError('Leaflet is required');

      // Restore window.L
      window.L = L;
    });

    it('should throw an error if Leaflet version is <1.0', function () {
      var L = _.clone(window.L);

      window.L = { version: '0.7' };
      expect(function () {
        client.getLeafletLayer();
      }).toThrowError('Leaflet +1.0 is required');

      // Restore window.L
      window.L = L;
    });
  });

  describe('.getGoogleMapsMapType', function () {
    var element;
    var mapType;

    beforeEach(function () {
      element = document.createElement('div');
      mapType = client.getGoogleMapsMapType(new google.maps.Map(element));
    });

    afterEach(function () {
      element.remove();
    });

    it('should return an instance of GoogleMapsMapType', function () {
      expect(mapType instanceof GoogleMapsMapType).toBe(true);
    });

    it('should return the same object', function () {
      expect(mapType === client.getGoogleMapsMapType()).toBe(true);
    });

    it('should return an object with a MapType interface', function () {
      expect(mapType.tileSize).toBeDefined();
      expect(mapType.getTile).toBeDefined();
    });

    it('should throw an error if Google Maps is not loaded', function () {
      var google = _.clone(window.google);

      window.google = undefined;
      expect(function () {
        client.getGoogleMapsMapType();
      }).toThrowError('Google Maps is required');

      window.google = { maps: undefined };
      expect(function () {
        client.getGoogleMapsMapType();
      }).toThrowError('Google Maps is required');

      // Restore window.google
      window.google = google;
    });

    it('should throw an error if Google Maps version is < 3.31', function () {
      var google = _.clone(window.google);

      window.google.maps = { version: '2.4' };
      expect(function () {
        client.getGoogleMapsMapType();
      }).toThrowError('Google Maps version should be >= 3.31');

      // Restore window.google
      window.google = google;
    });
  });

  describe('engine bindings', function () {
    it('should capture engine LAYER_ERROR and trigger own error', function () {
      var capturedError;
      client.on(Events.ERROR, function (error) {
        capturedError = error;
      });

      client._engine._eventEmmitter.trigger(Engine.Events.LAYER_ERROR);

      expect(capturedError).toBeDefined();
      expect(capturedError.name).toEqual('CartoError');
    });
  });
});

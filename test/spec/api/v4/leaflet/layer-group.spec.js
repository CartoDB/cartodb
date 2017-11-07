var L = require('leaflet');
var carto = require('../../../../../src/api/v4');

describe('src/api/v4/leaflet/layer-group', function () {
  var client;
  var layer;
  var layerGroup;
  var map;
  var mapContainer;

  beforeEach(function () {
    mapContainer = document.createElement('div');
    mapContainer.id = 'map';
    document.body.appendChild(mapContainer);

    client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      serverUrl: 'https://{user}.carto.com:443',
      username: 'cartojs-test'
    });
    map = L.map('map').setView([42.431234, -8.643616], 5);
    layerGroup = client.getLeafletLayerView();
  });

  afterEach(function () {
    document.getElementById('map').remove();
  });

  describe('addTo', function () {
    it('should add a leaflet layer to the map', function () {
      expect(countLeafletLayers(map)).toEqual(0);

      layerGroup.addTo(map);

      expect(countLeafletLayers(map)).toEqual(1);
    });
  });

  describe('removeFrom', function () {
    it('should remove the leaflet layer from the map', function () {
      expect(countLeafletLayers(map)).toEqual(0);

      layerGroup.addTo(map);

      expect(countLeafletLayers(map)).toEqual(1);

      layerGroup.removeFrom(map);

      expect(countLeafletLayers(map)).toEqual(0);
    });
  });

  describe('layer events', function () {
    var spy;

    beforeEach(function () {
      spy = jasmine.createSpy('spy');

      layerGroup.addTo(map);

      var source = new carto.source.SQL('foo');
      var style = new carto.style.CartoCSS('bar');
      layer = new carto.layer.Layer(source, style);

      client.addLayer(layer, { reload: false });
    });

    it('should trigger carto.layer.events.FEATURE_CLICKED event', function () {
      layer.on(carto.layer.events.FEATURE_CLICKED, spy);

      var internalEvent = {
        layer: {
          id: layer.getId()
        },
        latlng: [ 10, 20 ],
        feature: { name: 'foo' }
      };

      var externalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      layerGroup._internalLayerGroupView.trigger('featureClick', internalEvent);

      expect(spy).toHaveBeenCalledWith(externalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OVER event', function () {
      layer.on(carto.layer.events.FEATURE_OVER, spy);

      var internalEvent = {
        layer: {
          id: layer.getId()
        },
        latlng: [ 10, 20 ],
        feature: { name: 'foo' }
      };

      var externalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      layerGroup._internalLayerGroupView.trigger('featureOver', internalEvent);

      expect(spy).toHaveBeenCalledWith(externalEvent);
    });

    it('should trigger carto.layer.events.FEATURE_OUT featureOut events', function () {
      layer.on(carto.layer.events.FEATURE_OUT, spy);

      var internalEvent = {
        layer: {
          id: layer.getId()
        },
        latlng: [ 10, 20 ],
        feature: { name: 'foo' }
      };

      var externalEvent = {
        data: { name: 'foo' },
        latLng: { lat: 10, lng: 20 }
      };

      layerGroup._internalLayerGroupView.trigger('featureOut', internalEvent);

      expect(spy).toHaveBeenCalledWith(externalEvent);
    });
  });

  function countLeafletLayers (map) {
    return Object.keys(map._layers).length;
  }
});

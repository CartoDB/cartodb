var ConfigModel = require('builder/data/config-model');
var TileJSONModel = require('builder/components/modals/add-basemap/tilejson/tilejson-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('components/modals/add-basemap/tilejson/tilejson-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
        category: 'TileJSON',
        className: 'httpsatilesmapboxcomv3mapboxgeographyclasszxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new TileJSONModel();
  });

  describe('.hasAlreadyAddedLayer', function () {
    beforeEach(function () {
      this.customBaselayerModel = new CustomBaselayerModel({
        id: 'basemap-id-2',
        urlTemplate: 'https://b.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
        attribution: null,
        maxZoom: 21,
        minZoom: 0,
        className: 'httpsbtilesmapboxcomv3mapboxgeographyclasszxypng',
        name: 'Geography Class',
        tms: false,
        category: 'TileJSON',
        type: 'Tiled'
      });
    });

    it('should return true if layer has already been added', function () {
      this.model.set('layer', this.customBaselayerModel);
      expect(this.model.hasAlreadyAddedLayer(this.customBaselayersCollection)).toBe(false);

      this.model.set('layer', this.customBaselayersCollection.at(0));
      expect(this.model.hasAlreadyAddedLayer(this.customBaselayersCollection)).toBe(true);
    });
  });
});

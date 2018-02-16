var ConfigModel = require('builder/data/config-model');
var MapboxModel = require('builder/components/modals/add-basemap/mapbox/mapbox-model.js');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('editor/components/modals/add-basemap/mapbox/mapbox-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.tiles.mapbox.com/v4/map.id/{z}/{x}/{y}.png?access_token=',
        category: 'Mapbox',
        className: 'httpsatilesmapboxcomv4mapidzxypngaccess_token'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new MapboxModel();
  });

  describe('.hasAlreadyAddedLayer', function () {
    it('should return true if layer has already been added', function () {
      this.model.set('layer', new CustomBaselayerModel({}));
      expect(this.model.hasAlreadyAddedLayer(this.customBaselayersCollection)).toBeFalsy();

      this.model.set('layer', this.customBaselayersCollection.at(0));
      expect(this.model.hasAlreadyAddedLayer(this.customBaselayersCollection)).toBeTruthy();
    });
  });
});

var ConfigModel = require('builder/data/config-model');
var XYZModel = require('builder/components/modals/add-basemap/xyz/xyz-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('components/modals/add-basemap/xyz/xyz-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        category: 'Custom',
        className: 'httpsaexamplecomzxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new XYZModel();
  });

  describe('.hasAlreadyAddedLayer', function () {
    beforeEach(function () {
      this.customBaselayerModel = new CustomBaselayerModel({
        id: 'basemap-id-2',
        urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
        attribution: null,
        maxZoom: 21,
        minZoom: 0,
        className: 'httpsbexamplecomzxypng',
        name: 'item #2',
        tms: false,
        category: 'Custom',
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

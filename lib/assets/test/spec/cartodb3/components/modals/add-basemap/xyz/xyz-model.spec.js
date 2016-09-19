var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var XYZViewModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/xyz/xyz-model');
var CustomBaselayersCollection = require('../../../../../../../javascripts/cartodb3/data/custom-baselayers-collection');
var CustomBaselayerModel = require('../../../../../../../javascripts/cartodb3/data/custom-baselayer-model');

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

    this.model = new XYZViewModel();
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

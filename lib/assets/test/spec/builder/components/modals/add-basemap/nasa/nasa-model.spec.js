var ConfigModel = require('builder/data/config-model');
var NASAModel = require('builder/components/modals/add-basemap/nasa/nasa-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('components/modals/add-basemap/nasa/nasa-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/2016-09-20/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
        category: 'NASA',
        className: 'httpmap1visearthdatanasagovwmtswebmercmodis_terra_correctedreflectance_truecolordefault20160920googlemapscompatible_level9zyxjpeg'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new NASAModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });
  });

  describe('when model changes', function () {
    beforeEach(function () {
      this.model.set({
        date: '2015-05-25',
        layerType: 'day'
      });
    });

    it('should set layer', function () {
      expect(this.model.get('layer')).toEqual(jasmine.any(Object));
    });

    it('should set layer with expected params', function () {
      var layer = this.model.get('layer');
      expect(layer.get('urlTemplate')).toMatch('/2015-05-25/.*\{x\}');
      expect(layer.get('attribution')).toEqual(jasmine.any(String));
      expect(layer.get('maxZoom')).toEqual(jasmine.any(Number));
      expect(layer.get('minZoom')).toEqual(jasmine.any(Number));
      expect(layer.get('name')).toMatch('.* 2015-05-25');
    });
  });

  describe('.hasAlreadyAddedLayer', function () {
    beforeEach(function () {
      this.customBaselayerModel = new CustomBaselayerModel({
        id: 'basemap-id-2',
        urlTemplate: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/2015-05-25/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
        className: 'httpmap1visearthdatanasagovwmtswebmercviirscitylights2012default20150525googlemapscompatiblelevel8zyxjpeg',
        category: 'NASA'
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

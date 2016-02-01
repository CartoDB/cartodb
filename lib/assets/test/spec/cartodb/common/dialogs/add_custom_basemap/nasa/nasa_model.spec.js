var cdb = require('cartodb.js-v3');
var NASAModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/nasa/nasa_model.js');

describe('common/dialog/add_custom_basemap/nasa/nasa_model', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new NASAModel({
      baseLayers: this.baseLayers
    });
  });

  describe('when model changes', function() {
    beforeEach(function() {
      this.model.set({
        date: '2015-05-25',
        layerType: 'night'
      });
    });

    it('should set layer', function() {
      expect(this.model.get('layer')).toEqual(jasmine.any(Object));
    });

    it('should set layer with expected params', function() {
      var layer = this.model.get('layer');
      expect(layer.get('urlTemplate')).toMatch('/2015-05-25/.*\{x\}');
      expect(layer.get('attribution')).toEqual(jasmine.any(String));
      expect(layer.get('maxZoom')).toEqual(jasmine.any(Number));
      expect(layer.get('minZoom')).toEqual(jasmine.any(Number));
      expect(layer.get('name')).toMatch('.* 2015-05-25');
    });
  });

  describe('.hasAlreadyAddedLayer', function() {
    beforeEach(function() {
      this.baseLayers = new cdb.admin.UserLayers();
    });

    it('should return true if current layer is already added', function() {
      this.model.set('layer', new cdb.admin.TileLayer({
        urlTemplate: 'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/2015-05-25/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'
      }));
      expect(this.model.hasAlreadyAddedLayer(this.baseLayers)).toBeFalsy();

      this.baseLayers.add(this.model.get('layer'));
      expect(this.model.hasAlreadyAddedLayer(this.baseLayers)).toBeTruthy();
    });
  });
});

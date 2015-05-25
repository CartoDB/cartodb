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
});

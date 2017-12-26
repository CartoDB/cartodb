var cdb = require('cartodb.js-v3');
var XYZViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/xyz/xyz_model.js');

describe('common/dialog/add_custom_basemap/xyz/xyz_model', function() {
  beforeEach(function() {
    this.model = new XYZViewModel({
    });
  });

  describe('.hasAlreadyAddedLayer', function() {
    beforeEach(function() {
      this.baseLayers = new cdb.admin.UserLayers();
      this.baseLayers.add({
        kind: 'tiled',
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
      });
    });

    it('should return true if layer has already been added', function() {
      this.model.set('layer', new cdb.admin.TileLayer({}));
      expect(this.model.hasAlreadyAddedLayer(this.baseLayers)).toBeFalsy();

      this.model.set('layer', this.baseLayers.at(0));
      expect(this.model.hasAlreadyAddedLayer(this.baseLayers)).toBeTruthy();
    });
  });
});

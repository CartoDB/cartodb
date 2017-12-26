var cdb = require('cartodb.js-v3');
var MapboxViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/mapbox/mapbox_model.js');

describe('common/dialog/add_custom_basemap/mapbox/mapbox_model', function() {
  beforeEach(function() {
    this.model = new MapboxViewModel({
    });
  });

  describe('.hasAlreadyAddedLayer', function() {
    beforeEach(function() {
      this.baseLayers = new cdb.admin.UserLayers();
      this.baseLayers.add({
        kind: 'tiled',
        urlTemplate: 'https://a.tiles.mapbox.com/v4/username.12ab45c/{z}/{x}/{y}.png?access_token…aBcDC12323abc'
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

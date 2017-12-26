var cdb = require('cartodb.js-v3');
var TileJSONViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/tile_json/tile_json_view_model.js');

describe('common/dialog/add_custom_basemap/tile_json/tile_json_view_model', function() {
  beforeEach(function() {
    this.model = new TileJSONViewModel({
    });
  });

  describe('.hasAlreadyAddedLayer', function() {
    beforeEach(function() {
      this.baseLayers = new cdb.admin.UserLayers();
      this.baseLayers.add({
        kind: 'tiled',
        urlTemplate: '"http://a.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=B4mp4daM",'
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

/* global cdb */

describe('MapInfowindow', function () {
  describe('leaflet', function () {
    GroupLayerSpecs(cdb.admin.LeafletMapView);
  });

  function GroupLayerSpecs (MapViewClass) {
    beforeEach(function () {
      var map = new cdb.admin.Map();
      var mapView = new MapViewClass({ map: map, user: new cdb.admin.User() });

      var model = new cdb.geo.ui.InfowindowModel({
        fields: [{ name: 'name', title: true, position: 0 }, { name: 'length', position: 1, title: true }]
      });

      var table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['name', 'lorem ipsum'],
          ['description', 'dolor sit amet'],
          ['length', 4]
        ]
      });

      this.view = new cdb.admin.MapInfowindow({
        model: model,
        mapView: mapView,
        table: table
      });

      this.view.row = {
        attributes: {
          name: 'lorem ipsum',
          length: 4
        }
      };

      spyOn(this.view, 'setLoading');
      this.view.renderInfo();
    });

    it('should update the model with fields including the length one', function () {
      expect(this.view.model.get('fields')[0]['name']).toContain('name');
      expect(this.view.model.get('fields')[1]['name']).toContain('length');
    });

    it('should not set loading', function () {
      expect(this.view.setLoading).not.toHaveBeenCalled();
    });
  }
});

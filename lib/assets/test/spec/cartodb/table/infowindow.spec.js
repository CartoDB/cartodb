describe('MapInfowindow', function () {
  describe('leaflet', function() {
    GroupLayerSpecs(cdb.admin.LeafletMapView);
  });

  function GroupLayerSpecs(mapViewClass) {
    beforeEach(function () {
      base = new cdb.geo.TileLayer({ urlTemplate: 'test' });
      layer1 = new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: true});
      layer2 = new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true});
      var map = new cdb.admin.Map();
      mapView = new mapViewClass({ map: map, user: new cdb.admin.User() });

      model = new cdb.geo.ui.InfowindowModel({
        fields: [{ name: 'name1', title: true, position: 0, length: 4 }]
      });

      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['name1', 'string'],
          ['name2', 'number'],
          ['name3', 'number']
        ]
      });

      this.view = new cdb.admin.MapInfowindow({
        model: model,
        mapView: mapView,
        table: table
      });

      this.view.row = {
        attributes: {
          name: 'caracola',
          length: 4
        }
      };

      spyOn(this.view, 'setLoading');
      this.view.renderInfo();
    });

    it('should update the model with fields blabla (explain better what are the side-effects calling renderInfo', function () {
      expect(this.view.model.get('content').fields).toContain('name');
      expect(this.view.model.get('content').fields).toContain('length');
    });

    it('should not set loading', function () {
      expect(this.view.setLoading).not.toHaveBeenCalled();
    });
  }
});

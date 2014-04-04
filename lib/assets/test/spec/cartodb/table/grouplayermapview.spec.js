

describe("GrouperLayerMapView", function() {

  var base, layer1, layer2, mapView;

  describe('gmaps', function() {
    GroupLayerSpecs(cdb.admin.GoogleMapsMapView);
  });

  describe('leaflet', function() {
    GroupLayerSpecs(cdb.admin.LeafletMapView);
  });


  function GroupLayerSpecs(mapViewClass) {

    beforeEach(function() {
      base = new cdb.geo.TileLayer({ urlTemplate: 'test' });
      layer1 = new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: true});
      layer2 = new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true});
      var map = new cdb.admin.Map();
      mapView = new mapViewClass({ map: map });
    });

    it("should group cartodb layers when they are added", function() {

      mapView.map.layers.add(base);
      mapView.map.layers.add(layer1);
      mapView.map.layers.add(layer2);

      expect(
        mapView.getLayerByCid(layer1.cid) === mapView.getLayerByCid(layer2.cid)
      ).toEqual(true);

      expect(_(mapView.layers).size()).toEqual(3);
      expect(mapView.groupLayer.getLayerCount()).toEqual(2);
    });

    it("should remove layer", function() {
      mapView.map.layers.add(base);
      mapView.map.layers.add(layer1);
      mapView.map.layers.add(layer2);

      mapView.map.layers.remove(layer1);

      expect(_(mapView.layers).size()).toEqual(2);
      expect(mapView.groupLayer.getLayerCount()).toEqual(1);
    });

    it("should remove all layers", function() {
      mapView.map.layers.add(base);
      mapView.map.layers.add(layer1);
      mapView.map.layers.add(layer2);

      mapView._removeLayers();

      expect(_(mapView.layers).size()).toEqual(0);
      expect(mapView.groupLayer).toEqual(null);
    });

    it("set active layer", function() {
      mapView.map.layers.add(base);
      mapView.map.layers.add(layer1);
      mapView.map.layers.add(layer2);

      spyOn(mapView.groupLayer, 'setInteraction');

      mapView.setActiveLayer(layer1);

      expect(mapView.groupLayer.setInteraction.calls.count()).toEqual(2);
      var spyCall = mapView.groupLayer.setInteraction.calls.argsFor(0);
      expect(spyCall).toEqual([0, true]);
      spyCall = mapView.groupLayer.setInteraction.calls.argsFor(1);
      expect(spyCall).toEqual([1, false]);

    });

    it("is the layer changes should update the layer definition", function() {
      mapView.map.layers.add(base);
      mapView.map.layers.add(layer1);
      mapView.map.layers.add(layer2);
      spyOn(mapView.groupLayer, 'setLayerDefinition');

      layer1.set('tile_style', 'whatever');
      expect(mapView.groupLayer.setLayerDefinition).toHaveBeenCalled();
    });


  };


});

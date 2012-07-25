
describe("geo.map", function() {


  describe('TileLayer', function() {
    it("should be type tiled", function() {
      var layer = new cdb.geo.TileLayer();
      expect(layer.get('type')).toEqual("Tiled");
    });
  });

  describe('CartoDBLayer', function() {
    it("should be type CartoDB", function() {
      var layer = new cdb.geo.CartoDBLayer();
      expect(layer.get('type')).toEqual("CartoDB");
    });
  });

  describe('LeafletMapView', function() {
    var mapView;
    var map;
    var spy;
    beforeEach(function() {
      var container = $('<div>').css('height', '200px');
      //$('body').append(container);
      map = new cdb.geo.Map();
      mapView = new cdb.geo.LeafletMapView({
        el: container,
        map: map
      });

      layerURL = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png';
      layer    = new cdb.geo.TileLayer({ urlTemplate: layerURL });

      spy = {
        zoomChanged: function(){},
        centerChanged: function(){}
      };

      spyOn(spy, 'zoomChanged');
      spyOn(spy, 'centerChanged');
      map.bind('change:zoom', spy.zoomChanged);
      map.bind('change:center', spy.centerChanged);
    });

    it("should change zoom", function() {
      mapView._setZoom(10);
      expect(spy.zoomChanged).toHaveBeenCalled();
    });

    it("should allow adding a layer", function() {
      map.addLayer(layer);
      expect(map.layers.length).toEqual(1);
    });

    it("should add layers on reset", function() {
      map.layers.reset([
        layer
      ]);
      expect(map.layers.length).toEqual(1);
    });

    it("should create a layer view when adds a model", function() {
      map.addLayer(layer);
      expect(map.layers.length).toEqual(1);
      expect(_.size(mapView.layers)).toEqual(1);
    });

    it("should allow removing a layer", function() {
      map.addLayer(layer);
      map.removeLayer(layer);
      expect(map.layers.length).toEqual(0);
      expect(_.size(mapView.layers)).toEqual(0);
    });

    it("should allow removing a layer by index", function() {
      map.addLayer(layer);
      map.removeLayerAt(0);
      expect(map.layers.length).toEqual(0);
    });

    it("should allow removing a layer by Cid", function() {
      var cid = map.addLayer(layer);
      map.removeLayerByCid(cid);
      expect(map.layers.length).toEqual(0);
    });

    it("should create a TiledLayerView when the layer is Tiled", function() {
      var lyr = map.addLayer(layer);
      var layerView = mapView.getLayerByCid(lyr);
      expect(layerView.__proto__.constructor).toEqual(cdb.geo.LeafLetTiledLayerView);
    });

    it("should create a CartoDBLayer when the layer is cartodb", function() {
      layer    = new cdb.geo.CartoDBLayer({});
      var lyr = map.addLayer(layer);
      var layerView = mapView.getLayerByCid(lyr);
      expect(layerView.__proto__.constructor).toEqual(cdb.geo.LeafLetLayerCartoDBView);
    });


  });

});

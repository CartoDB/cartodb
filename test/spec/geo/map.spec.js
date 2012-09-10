
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

  describe("Layers", function() {
    var layers;
    beforeEach(function() {
      layers = new cdb.geo.Layers();
    });

    it("should clone", function() {
      var layer = new cdb.geo.CartoDBLayer();
      layers.add(layer);
      var copy = layers.clone();
      expect(copy.size()).toEqual(layers.size());
      expect(copy.models[0].attributes).toEqual(layers.models[0].attributes);
    });

  });
  describe("Map", function() {
    var map;
    beforeEach(function() {
      map = new cdb.geo.Map();
    });

    it("should clone", function() {
      var old = new cdb.geo.CartoDBLayer({});
      map.setCenter([1,0]);
      map.addLayer(old);
      var m = map.clone();
      expect(m.layers.size()).toEqual(1);
      expect(m.get('center')).toEqual([1,0]);
    });


    it("should set base layer", function() {
      var old = new cdb.geo.CartoDBLayer({});
      map.addLayer(old);
      var layer    = new cdb.geo.CartoDBLayer({});
      map.addLayer(layer);
      var base = new cdb.geo.CartoDBLayer({});
      var r = map.setBaseLayer(base);
      expect(r).toEqual(old);
      expect(map.layers.at(0)).toEqual(base);
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
      var spy = { c: function() {} };
      spyOn(spy, 'c');
      mapView.bind('newLayerView', spy.c);
      map.addLayer(layer);
      expect(map.layers.length).toEqual(1);
      expect(_.size(mapView.layers)).toEqual(1);
      expect(spy.c).toHaveBeenCalled();
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

    it("should create a PlaiLayer when the layer is cartodb", function() {
      layer    = new cdb.geo.PlainLayer({});
      var lyr = map.addLayer(layer);
      var layerView = mapView.getLayerByCid(lyr);
      expect(layerView.__proto__.constructor).toEqual(cdb.geo.LeafLetPlainLayerView);
    });

    it("should insert layers in specified order", function() {
      var layer    = new cdb.geo.CartoDBLayer({});
      map.addLayer(layer);

      spyOn(mapView.map_leaflet,'addLayer');
      layer    = new cdb.geo.PlainLayer({});
      map.addLayer(layer, {at: 0});

      expect(mapView.map_leaflet.addLayer.mostRecentCall.args[1]).toEqual(true);
      //expect(mapView.map_leaflet.addLayer).toHaveBeenCalledWith(mapView.layers[layer.cid].leafletLayer, true);
    });

    it("should not insert map boundaries when not defined by the user", function() {
      expect(mapView.map_leaflet.options.maxBounds).toBeFalsy();
    });

    it("should insert the boundaries when provided", function() {
      var container = $('<div>').css('height', '200px');
      var map = new cdb.geo.Map({bounding_box_sw: [1,2], bounding_box_ne: [3,5]});

      var mapView = new cdb.geo.LeafletMapView({
        el: this.container,
        map: map
      });
      expect(map.get('bounding_box_sw')).toEqual([1,2]);
      expect(map.get('bounding_box_ne')).toEqual([3,5]);
      expect(mapView.map_leaflet.options.maxBounds).toBeTruthy();
      expect(mapView.map_leaflet.options.maxBounds.getNorthEast().lat).toEqual(3);
      expect(mapView.map_leaflet.options.maxBounds.getNorthEast().lng).toEqual(5);
      expect(mapView.map_leaflet.options.maxBounds.getSouthWest().lat).toEqual(1);
      expect(mapView.map_leaflet.options.maxBounds.getSouthWest().lng).toEqual(2);

    })


  });

});

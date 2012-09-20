
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
      var a = _.clone(layers.models[0].attributes);
      a.id = null;
      expect(copy.models[0].attributes).toEqual(a);
      expect(copy.get('id')).toEqual(undefined);
    });

    it("should assign order each time is added", function() {
      var layer = new cdb.geo.CartoDBLayer();
      layers.add(layer);
      expect(layer.get('order')).toEqual(0);
      var layer2 = new cdb.geo.CartoDBLayer();
      layers.add(layer2);
      expect(layer2.get('order')).toEqual(1);
      layer.destroy();
      expect(layer2.get('order')).toEqual(0);
      layers.add(new cdb.geo.CartoDBLayer(),{at: 0});
      expect(layer2.get('order')).toEqual(1);


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
      expect(r).toEqual(base);
      expect(map.layers.at(0)).toEqual(base);
    });

  });

  describe('MapView', function() {
    beforeEach(function() {
      this.container = $('<div>').css('height', '200px');

      this.map = new cdb.geo.Map();
      this.mapView = new cdb.geo.MapView({
        el: this.container,
        map: this.map
      });
    });

    it('should be able to add a infowindow', function() {
      var infow = new cdb.geo.ui.Infowindow({mapView: this.mapView, model: new Backbone.Model()});
      this.mapView.addInfowindow(infow);

      expect(this.mapView._subviews[infow.cid]).toBeTruthy()
      expect(this.mapView._subviews[infow.cid] instanceof cdb.geo.ui.Infowindow).toBeTruthy()

    });

    it('should be able to retrieve the infowindows', function() {
      var infow = new cdb.geo.ui.Infowindow({mapView: this.mapView, model: new Backbone.Model()});
      this.mapView._subviews['irrelevant'] = new Backbone.View();
      this.mapView.addInfowindow(infow);

      var infowindows = this.mapView.getInfoWindows()


      expect(infowindows.length).toEqual(1);
      expect(infowindows[0]).toEqual(infow);
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

    it("should inser layer in specified order", function() {
      var layer    = new cdb.geo.CartoDBLayer({});
      map.addLayer(layer);

      spyOn(mapView.map_leaflet,'addLayer');
      layer    = new cdb.geo.PlainLayer({});
      map.addLayer(layer, {at: 0});

      expect(mapView.map_leaflet.addLayer.mostRecentCall.args[1]).toEqual(true);
      //expect(mapView.map_leaflet.addLayer).toHaveBeenCalledWith(mapView.layers[layer.cid].leafletLayer, true);
    });

    it("shoule remove all layers when map view is cleaned", function() {

      var id1 = map.addLayer(new cdb.geo.CartoDBLayer({}));
      var id2 = map.addLayer(new cdb.geo.CartoDBLayer({}));

      expect(_.size(mapView.layers)).toEqual(2);
      var layer = mapView.getLayerByCid(id1);
      var layer2 = mapView.getLayerByCid(id2);
      spyOn(layer, 'remove');
      spyOn(layer2, 'remove');
      mapView.clean();
      expect(_.size(mapView.layers)).toEqual(0);
      expect(layer.remove).toHaveBeenCalled();
      expect(layer2.remove).toHaveBeenCalled();
    });

    it("should not all a layer when it can't be creadted", function() {
      var layer    = new cdb.geo.TileLayer({type: 'rambo'});
      map.addLayer(layer);
      expect(_.size(mapView.layers)).toEqual(0);
    });

    var geojsonFeature = {
      "type": "Feature",
      "properties": { "name": "Coors Field", },
      "geometry": {
          "type": "Point",
          "coordinates": [-104.99404, 39.75621]
      }
    };

    it("should add a geometry", function() {
      var geo = new cdb.geo.Geometry({
        geojson: geojsonFeature
      });
      map.addGeometry(geo);
      expect(_.size(mapView.geometries)).toEqual(1);
    });




  });

});

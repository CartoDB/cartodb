
describe("geo.map", function() {

  describe('cdb.geo.MapLayer', function() {
    var layer;

    beforeEach(function() {
      layer  = new cdb.geo.MapLayer();
      layer.url = function() {return true};
      layer.sync = function() {return true};
    });
  });

  describe('GMapsBaseLayer', function() {
    it("should be type GMapsBase", function() {
      var layer = new cdb.geo.GMapsBaseLayer();
      expect(layer.get('type')).toEqual("GMapsBase");
    });
  });

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

  describe('CartoDBGroupLayer', function() {
    it("should be type layergroup", function() {
      var layer = new cdb.geo.CartoDBGroupLayer();
      expect(layer.get('type')).toEqual("layergroup");
    });
  });

  describe("Layers", function() {
    var layers;

    beforeEach(function() {
      layers = new cdb.geo.Layers();
    });

    it("should compare equal layers correctly", function() {
      var layer1 = new cdb.geo.PlainLayer({ name: 'Positron' });
      var layer2 = new cdb.geo.PlainLayer({});
      var layer3 = new cdb.geo.PlainLayer({});
      var layer4 = new cdb.geo.PlainLayer({});

      expect(layer3.isEqual(layer4)).toBeTruthy();
      expect(layer1.isEqual(layer2)).not.toBeTruthy();

      layers.add(layer4);
      layers.add(layer3);

      expect(layer3.isEqual(layer4)).toBeTruthy();
    })

    it("should compare TileLayers", function() {
      var layer1 = new cdb.geo.TileLayer({ urlTemplate: 'urlTemplate', name: 'layer1', other: 'something' });
      var layer2 = new cdb.geo.TileLayer({ urlTemplate: 'urlTemplate', name: 'layer2', other: 'else' });

      expect(layer1.isEqual(layer2)).toBeFalsy();

      layer2.set({ name: 'layer1' }, { silent: true});

      expect(layer1.isEqual(layer2)).toBeTruthy();
    })

    it("should re-assign order when new layers are added to the collection", function() {
      var baseLayer = new cdb.geo.TileLayer();
      var layer1 = new cdb.geo.CartoDBLayer();
      var layer2 = new cdb.geo.CartoDBLayer();
      var layer3 = new cdb.geo.CartoDBLayer();

      // Sets the order to 0
      layers.add(baseLayer);

      expect(baseLayer.get('order')).toEqual(0);

      // Sets the order to 1
      layers.add(layer1);
      layers.add(layer2);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(1);
      expect(layer2.get('order')).toEqual(2);

      // Sets the order to 1 and re-orders the rest of the layers
      layers.add(layer3, { at: 1});

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(2);
      expect(layer2.get('order')).toEqual(3);
      expect(layer3.get('order')).toEqual(1);

      var torqueLayer = new cdb.geo.TorqueLayer({});

      // Torque layer should be at the top
      layers.add(torqueLayer);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(2);
      expect(layer2.get('order')).toEqual(3);
      expect(layer3.get('order')).toEqual(1);
      expect(torqueLayer.get('order')).toEqual(4);

      var tiledLayer = new cdb.geo.TileLayer({});

      // Tiled layer should be at the top
      layers.add(tiledLayer);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(2);
      expect(layer2.get('order')).toEqual(3);
      expect(layer3.get('order')).toEqual(1);
      expect(torqueLayer.get('order')).toEqual(4);
      expect(tiledLayer.get('order')).toEqual(5);

      var layer4 = new cdb.geo.CartoDBLayer({});
      layers.add(layer4);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(2);
      expect(layer2.get('order')).toEqual(3);
      expect(layer3.get('order')).toEqual(1);
      expect(layer4.get('order')).toEqual(4);
      expect(torqueLayer.get('order')).toEqual(5);
      expect(tiledLayer.get('order')).toEqual(6);
    });

    it("should re-assign order when new layers are removed from the collection", function() {
      var baseLayer = new cdb.geo.TileLayer();
      var layer1 = new cdb.geo.CartoDBLayer();
      var layer2 = new cdb.geo.CartoDBLayer();
      var torqueLayer = new cdb.geo.TorqueLayer({});
      var labelsLayer = new cdb.geo.TileLayer();

      // Sets the order to 0
      layers.add(baseLayer);
      layers.add(layer1);
      layers.add(layer2);
      layers.add(torqueLayer);
      layers.add(labelsLayer);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer1.get('order')).toEqual(1);
      expect(layer2.get('order')).toEqual(2);
      expect(torqueLayer.get('order')).toEqual(3);
      expect(labelsLayer.get('order')).toEqual(4);

      layers.remove(layer1);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer2.get('order')).toEqual(1);
      expect(torqueLayer.get('order')).toEqual(2);
      expect(labelsLayer.get('order')).toEqual(3);

      layers.remove(torqueLayer);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer2.get('order')).toEqual(1);
      expect(labelsLayer.get('order')).toEqual(2);

      layers.remove(labelsLayer);

      expect(baseLayer.get('order')).toEqual(0);
      expect(layer2.get('order')).toEqual(1);
    });
  });

  describe("Map", function() {
    var map;

    beforeEach(function() {
      map = new cdb.geo.Map();
    });

    it("should raise only one change event on setBounds", function() {
      var c = 0;
      map.bind('change:view_bounds_ne', function() {
        c++;
      });
      map.setBounds([[1,2],[1,2]]);
      expect(c).toEqual(1);
    });

    it("should not change center or zoom when the bounds are not ok", function() {
      var c = 0;
      map.bind('change:center', function() {
        c++;
      });
      map.setBounds([[1,2],[1,2]]);
      expect(c).toEqual(0);
    });

    it("should not change bounds when map size is 0", function() {
      map.set('zoom', 10);
      var bounds = [[43.100982876188546, 35.419921875], [60.23981116999893, 69.345703125]]
      map.fitBounds(bounds, {x: 0, y: 0});
      expect(map.get('zoom')).toEqual(10);
    });

    it("should adjust zoom to layer", function() {
      expect(map.get('maxZoom')).toEqual(40);
      expect(map.get('minZoom')).toEqual(0);

      var layer = new cdb.geo.PlainLayer({ minZoom: 5, maxZoom: 20 });
      map.layers.reset(layer);
      expect(map.get('maxZoom')).toEqual(20);
      expect(map.get('minZoom')).toEqual(5);

      var layer = new cdb.geo.PlainLayer({ minZoom: "7", maxZoom: "31" });
      map.layers.reset(layer);
      expect(map.get('maxZoom')).toEqual(31);
      expect(map.get('minZoom')).toEqual(7);
    });

    it("shouldn't set a NaN zoom", function() {
      var layer = new cdb.geo.PlainLayer({ minZoom: NaN, maxZoom: NaN });
      map.layers.reset(layer);
      expect(map.get('maxZoom')).toEqual(40);
      expect(map.get('minZoom')).toEqual(0);
    });

    it('should update the attributions of the map when layers are reset/added/removed', function() {

      map = new cdb.geo.Map();

      // Map has the default CartoDB attribution
      expect(map.get('attribution')).toEqual([
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>"
      ]);

      var layer1 = new cdb.geo.CartoDBLayer({ attribution: 'attribution1' });
      var layer2 = new cdb.geo.CartoDBLayer({ attribution: 'attribution1' });
      var layer3 = new cdb.geo.CartoDBLayer({ attribution: 'wadus' });
      var layer4 = new cdb.geo.CartoDBLayer({ attribution: '' });

      map.layers.reset([ layer1, layer2, layer3, layer4 ]);

      // Attributions have been updated removing duplicated and empty attributions
      expect(map.get('attribution')).toEqual([
        "attribution1",
        "wadus",
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
      ]);

      var layer = new cdb.geo.CartoDBLayer({ attribution: 'attribution2' });

      map.layers.add(layer);

      // The attribution of the new layer has been appended before the default CartoDB attribution
      expect(map.get('attribution')).toEqual([
        "attribution1",
        "wadus",
        "attribution2",
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
      ]);

      layer.set('attribution', 'new attribution');

      // The attribution of the layer has been updated in the map
      expect(map.get('attribution')).toEqual([
        "attribution1",
        "wadus",
        "new attribution",
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
      ]);

      map.layers.remove(layer);

      expect(map.get('attribution')).toEqual([
        "attribution1",
        "wadus",
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
      ]);

      // Addind a layer with the default attribution
      var layer = new cdb.geo.CartoDBLayer();

      map.layers.add(layer, { at: 0 });

      // Default CartoDB only appears once and it's the last one
      expect(map.get('attribution')).toEqual([
        "attribution1",
        "wadus",
        "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
      ]);
    })
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
});

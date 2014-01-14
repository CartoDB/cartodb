
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
      var layer1 = new cdb.geo.PlainLayer({color: '#zipote'});
      var layer2 = new cdb.geo.PlainLayer({});
      var layer3 = new cdb.geo.PlainLayer({});
      var layer4 = new cdb.geo.PlainLayer({});

      expect(layer3.isEqual(layer4)).toBeTruthy();
      expect(layer1.isEqual(layer2)).not.toBeTruthy();

      layers.add(layer4);
      layers.add(layer3);

      expect(layer3.isEqual(layer4)).toBeTruthy();
    })

    it("should assign indices", function() {
      var layer1 = new cdb.geo.PlainLayer({order: 10, color: '#zipote'});
      var layer2 = new cdb.geo.PlainLayer({});
      var layer3 = new cdb.geo.PlainLayer({});
      layers.add(layer1);
      expect(layer1.get('order')).toEqual(0);
      layers.add(layer2);
      expect(layer2.get('order')).toEqual(1);
      layers.add(layer3, { at: 1});
      expect(layer2.get('order')).toEqual(2);
      expect(layer3.get('order')).toEqual(1);
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

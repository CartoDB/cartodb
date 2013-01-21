
describe("geo.map", function() {

  describe('cdb.geo.MapLayer', function() {
    var layer;
    beforeEach(function() {
      layer  = new cdb.geo.MapLayer();
      layer.url = function() {return true};
      layer.sync = function() {return true};
    });

    it("should update the style when a new table name is set", function() {
      layer.set({tile_style: '#table_name {}'});
      layer.updateCartoCss('table_name', 'map_of_name');
      expect(layer.get('tile_style')).toEqual('#map_of_name {}');
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
      var old = new cdb.geo.CartoDBLayer({ urlTemplate:'x', base_type: "x" });
      map.addLayer(old);
      var layer    = new cdb.geo.CartoDBLayer({ urlTemplate:'y', base_type: "y" });
      map.addLayer(layer);
      var base = new cdb.geo.CartoDBLayer({ urlTemplate:'z', base_type: "z" });

      sinon.stub(base, "save").yieldsTo("success");
      var r = map.setBaseLayer(base);
      expect(r).toEqual(base);
      expect(map.layers.at(0)).toEqual(base);
    });

    it("shouldn't set base layer if the old base layer is the same", function() {
      var old = new cdb.geo.TileLayer({ type: 'Tiled', urlTemplate: 'x', base_type: 'x' })
        , opts = { alreadyAdded: function(){ console.log("base layer already added"); }};

      spyOn(opts, 'alreadyAdded');

      expect(map.setBaseLayer(old)).not.toBeFalsy();
      expect(map.setBaseLayer(old, opts)).toBeFalsy();
      expect(opts.alreadyAdded).toHaveBeenCalled();
    });

    it("should set a new attribution after change base layer", function() {
      var old = new cdb.geo.CartoDBLayer({ attribution: 'CartoDB1.0', type: 'Tiled', urlTemplate: 'x', base_type: 'x' });
      map.setBaseLayer(old);
      var old_attribution = map.get('attribution');

      var base = new cdb.geo.CartoDBLayer({ attribution: 'CartoDB2.0', type: 'Tiled', urlTemplate: 'y', base_type: 'y' });
      sinon.stub(base, "save").yieldsTo("success");
      var r = map.setBaseLayer(base);
      var new_attribution = map.get('attribution');

      expect(old_attribution[0]).not.toEqual(new_attribution[0]);
    });

    it("should not change bounds according to base layer", function() {
      var layer = new cdb.geo.CartoDBLayer({
        maxZoom: 8,
        minZoom: 7,
        type: 'Tiled',
        urlTemplate: 'x',
        base_type: 'x'
      });
      map.addLayer(layer);
      expect(map.get('maxZoom')).toEqual(28);
      expect(map.get('minZoom')).toEqual(0);
      var layerbase = new cdb.geo.CartoDBLayer({
        maxZoom: 10,
        minZoom: 9,
        type: 'Tiled',
        urlTemplate: 'y',
        base_type: 'y'
      });
      sinon.stub(layerbase, "save").yieldsTo("success");
      map.setBaseLayer(layerbase);
      expect(map.get('maxZoom')).toEqual(28);
      expect(map.get('minZoom')).toEqual(0);
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
    var container;
    beforeEach(function() {
      container = $('<div>').css({
          'height': '200px',
          'width': '200px'
      });
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
        centerChanged: function(){},
        changed: function() {}
      };

      spyOn(spy, 'zoomChanged');
      spyOn(spy, 'centerChanged');
      spyOn(spy, 'changed');
      map.bind('change:zoom', spy.zoomChanged);
      map.bind('change:center', spy.centerChanged);
      map.bind('change', spy.changed);
    });

    it("should change bounds when center is set", function() {
      var s = sinon.spy();
      spyOn(map, 'getViewBounds');
      map.bind('change:view_bounds_ne', s);
      map.set('center', [10, 10]);
      expect(s.called).toEqual(true);
      expect(map.getViewBounds).not.toHaveBeenCalled();
    });

    it("should change center and zoom when bounds are changed", function() {
      var s = sinon.spy();
      mapView.getSize = function() { return {x: 200, y: 200}; }
      map.bind('change:center', s);
      spyOn(mapView, '_setCenter');
      mapView._bindModel();
      runs(function() {
        map.set({
          'view_bounds_ne': [1, 1],
          'view_bounds_sw': [-0.3, -1.2]
        })
      });
      waits(1000);
      runs(function() {
        expect(mapView._setCenter).toHaveBeenCalled();
        //expect(s.called).toEqual(true);
      });
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
      expect(cdb.geo.LeafLetTiledLayerView.prototype.isPrototypeOf(layerView)).isPrototypeOf();
    });

    it("should create a CartoDBLayer when the layer is cartodb", function() {
      layer    = new cdb.geo.CartoDBLayer({});
      var lyr = map.addLayer(layer);
      var layerView = mapView.getLayerByCid(lyr);
      expect(layerView.setQuery).not.toEqual(undefined);
    });

    it("should create the cartodb logo", function() {
      runs(function() {
        layer = new cdb.geo.CartoDBLayer({ table_name: "INVENTADO"});
        var lyr = map.addLayer(layer);
        var layerView = mapView.getLayerByCid(lyr);
      });
      waits(1);
      runs(function() {
        expect(container.find("a.cartodb_logo").length).toEqual(1);
      });
    });

    it("should not add the cartodb logo when cartodb_logo = false", function() {
      runs(function() {
        layer = new cdb.geo.CartoDBLayer({ table_name: "INVENTADO", cartodb_logo: false});
        var lyr = map.addLayer(layer);
        var layerView = mapView.getLayerByCid(lyr);
      });
      waits(1);
      runs(function() {
        expect(container.find("a.cartodb_logo").length).toEqual(0);
      });
    });

    it("should create a PlaiLayer when the layer is cartodb", function() {
      layer    = new cdb.geo.PlainLayer({});
      var lyr = map.addLayer(layer);
      var layerView = mapView.getLayerByCid(lyr);
      expect(layerView.setQuery).not.toEqual(cdb.geo.LeafLetPlainLayerView);
    });

    it("should insert layers in specified order", function() {
      var layer    = new cdb.geo.CartoDBLayer({});
      map.addLayer(layer);

      spyOn(mapView.map_leaflet,'addLayer');
      var b = new cdb.geo.PlainLayer({});
      map.addLayer(b, {at: 0});

      expect(mapView.map_leaflet.addLayer.mostRecentCall.args[0].model).toEqual(layer);
      //expect(mapView.map_leaflet.addLayer).toHaveBeenCalledWith(mapView.layers[layer.cid].leafletLayer, true);
    });

    // DEPRECATED (by now)
    // it("should not insert map boundaries when not defined by the user", function() {
    //   expect(mapView.map_leaflet.options.maxBounds).toBeFalsy();
    // });

    // it("should insert the boundaries when provided", function() {
    //   var container = $('<div>').css('height', '200px');
    //   var map = new cdb.geo.Map({bounding_box_sw: [1,2], bounding_box_ne: [3,5]});

    //   var mapView = new cdb.geo.LeafletMapView({
    //     el: this.container,
    //     map: map
    //   });
    //   expect(map.get('bounding_box_sw')).toEqual([1,2]);
    //   expect(map.get('bounding_box_ne')).toEqual([3,5]);
    //   expect(mapView.map_leaflet.options.maxBounds).toBeTruthy();
    //   expect(mapView.map_leaflet.options.maxBounds.getNorthEast().lat).toEqual(3);
    //   expect(mapView.map_leaflet.options.maxBounds.getNorthEast().lng).toEqual(5);
    //   expect(mapView.map_leaflet.options.maxBounds.getSouthWest().lat).toEqual(1);
    //   expect(mapView.map_leaflet.options.maxBounds.getSouthWest().lng).toEqual(2);

    // })


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
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    };

    it("should add and remove a geometry", function() {
      var geo = new cdb.geo.Geometry({
        geojson: geojsonFeature
      });
      map.addGeometry(geo);
      expect(_.size(mapView.geometries)).toEqual(1);
      geo.destroy();
      expect(_.size(mapView.geometries)).toEqual(0);
    });

    it("should edit a geometry", function() {
      var geo = new cdb.geo.Geometry({
        geojson: geojsonFeature
      });
      map.addGeometry(geo);
      var v = mapView.geometries[geo.cid];
      v.trigger('dragend', null, [10, 20]);
      expect(geo.get('geojson')).toEqual({
        "type": "Point",
        "coordinates": [20, 10]
      })

    });

    it("should save automatically when the zoom or center changes", function() {
      spyOn(map, 'save');
      runs(function() {
        mapView.setAutoSaveBounds();
        map.set('center', [1,2]);
      });
      waits(1500);
      runs(function() {
        expect(map.save).toHaveBeenCalled();
      });

    });


  });

});

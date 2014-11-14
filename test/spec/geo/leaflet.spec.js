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

  it("should change center and zoom when bounds are changed", function(done) {
    var s = sinon.spy();
    mapView.getSize = function() { return {x: 200, y: 200}; }
    map.bind('change:center', s);
    spyOn(mapView, '_setCenter');
    mapView._bindModel();

    map.set({
      'view_bounds_ne': [1, 1],
      'view_bounds_sw': [-0.3, -1.2]
    })

    setTimeout(function() {
      expect(mapView._setCenter).toHaveBeenCalled();
      done();
    }, 1000);
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
    layer    = new cdb.geo.CartoDBLayer({
      table_name: 'test',
      user_name: 'test',
      tile_style: 'test'
    });
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView.setQuery).not.toEqual(undefined);
  });

  it("should create a CartoDBLayerGroup when the layer is LayerGroup", function() {
    layer = new cdb.geo.CartoDBGroupLayer({
      layer_definition: {
          version: '1.0.0',
          layers: [{
             type: 'cartodb',
             options: {
               sql: 'select * from ne_10m_populated_places_simple',
               cartocss: '#layer { marker-fill: red; }',
               interactivity: ['test', 'cartodb_id']
             }
          }]
        }
    });
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView.getLayerCount()).toEqual(1);
  });

  it("should create the cartodb logo", function(done) {
    layer = new cdb.geo.CartoDBLayer({ 
      table_name: "INVENTADO",
      user_name: 'test',
      tile_style: 'test'
    });
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);

    setTimeout(function() {
      expect(container.find("div.cartodb-logo").length).toEqual(1);
      done();
    }, 1);
  });

  it("should not add the cartodb logo when cartodb_logo = false", function(done) {
    layer = new cdb.geo.CartoDBLayer({ 
      table_name: "INVENTADO",
      user_name: 'test',
      tile_style: 'test',
      cartodb_logo: false
    });
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);

    setTimeout(function() {
      expect(container.find("div.cartodb-logo").length).toEqual(0);
      done();
    }, 1);
  });

  it("should create a PlaiLayer when the layer is cartodb", function() {
    layer    = new cdb.geo.PlainLayer({});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView.setQuery).not.toEqual(cdb.geo.LeafLetPlainLayerView);
  });

  it("should insert layers in specified order", function() {
    var layer = new cdb.geo.CartoDBLayer({
        table_name: "INVENTADO",
        user_name: 'test',
        tile_style: 'test'
      });
    map.addLayer(layer);

    spyOn(mapView.map_leaflet,'addLayer');
    var b = new cdb.geo.TileLayer({urlTemplate: 'test'});
    map.addLayer(b, {at: 0});

    expect(mapView.map_leaflet.addLayer.calls.mostRecent().args[0].model).toEqual(layer);
    //expect(mapView.map_leaflet.addLayer).toHaveBeenCalledWith(mapView.layers[layer.cid].leafletLayer, true);
  });

  it("shoule remove all layers when map view is cleaned", function() {

    var id1 = map.addLayer(new cdb.geo.CartoDBLayer({
        table_name: "INVENTADO",
        user_name: 'test',
        tile_style: 'test'
    }));
    var id2 = map.addLayer(new cdb.geo.CartoDBLayer({
        table_name: "INVENTADO",
        user_name: 'test',
        tile_style: 'test'
    }));

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
    });

  });

  it("should save automatically when the zoom or center changes", function(done) {
    spyOn(map, 'save');
    mapView.setAutoSaveBounds();
    map.set('center', [1,2]);

    setTimeout(function() {
      expect(map.save).toHaveBeenCalled();
      done();
    }, 1500);

  });

  it("should set z-order", function() {
    var layer1 = new cdb.geo.TileLayer({ urlTemplate:'test1'});
    var layer2 = new cdb.geo.TileLayer({ urlTemplate:'test2'});
    var layerView1 = mapView.getLayerByCid(map.addLayer(layer1));
    var layerView2 = mapView.getLayerByCid(map.addLayer(layer2, { at: 0 }));
    expect(layerView1.options.zIndex > layerView2.options.zIndex).toEqual(true);
  });

  it("should switch layer", function() {
    map.addLayer(layer);
    layer.set('type', 'torque');
    expect(mapView.layers[layer.cid] instanceof L.TorqueLayer).toEqual(true);
  });

  // Test cases for gmaps substitutes since the support is deprecated.
  _({ // GMaps basemap base_type: expected substitute data
    //empty = defaults to gray_roadmap
    "": {
      tiles: {
        providedBy: "cartocdn",
        type: "light"
      },
      subdomains: ['a','b','c','d'],
      minZoom: 0,
      maxZoom: 18,
      attribution: 'Map designs by <a href="http://stamen.com/">Stamen</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, Provided by <a href="http://cartodb.com">CartoDB</a>'
    },
    dark_roadmap: {
      tiles: {
        providedBy: "cartocdn",
        type: "dark"
      },
      subdomains: ['a','b','c','d'],
      minZoom: 0,
      maxZoom: 18,
      attribution: 'Map designs by <a href="http://stamen.com/">Stamen</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, Provided by <a href="http://cartodb.com">CartoDB</a>'
    },
    roadmap: {
      tiles: {
        providedBy: "nokia",
        type: "normal.day"
      },
      subdomains: ['1','2','3','4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    hybrid: {
      tiles: {
        providedBy: "nokia",
        type: "hybrid.day"
      },
      subdomains: ['1','2','3','4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    terrain: {
      tiles: {
        providedBy: "nokia",
        type: "terrain.day"
      },
      subdomains: ['1','2','3','4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    satellite: { // Nokia Satellite Day
      tiles: {
        providedBy: "nokia",
        type: "satellite.day"
      },
      subdomains: ['1','2','3','4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    }
  }).map(function(substitute, baseType) {
    var layerOpts;
    var testContext;

    if (baseType) {
      layerOpts = { base_type: baseType};
      testContext = 'with basemap "'+ baseType +'"';
    } else {
      testContext = 'with default basemap "gray_roadmap"';
    }

    describe("given a GMaps layer model "+ testContext, function () {
      var view;

      beforeEach(function() {
        var layer = new cdb.geo.GMapsBaseLayer(layerOpts);
        view = mapView.createLayer(layer);
      });

      it("should have a tileUrl based on substitute's template URL", function() {
        var tileUrl = view.getTileUrl({ x: 101, y: 202, z: 303 });

        expect(tileUrl).toContain(substitute.tiles.providedBy);
        expect(tileUrl).toContain(substitute.tiles.type);
      });

      it("should have substitute's attribution", function() {
        expect(view.options.attribution).toEqual(substitute.attribution);
      });

      it("should have substitute's minZoom", function() {
        expect(view.options.minZoom).toEqual(substitute.minZoom);
      });

      it("should have substitute's maxZoom", function() {
        expect(view.options.maxZoom).toEqual(substitute.maxZoom);
      });

      it("shouldn't have any opacity since gmaps basemap didn't have any", function() {
        expect(view.options.opacity).toEqual(1);
      });

      it("should match substitute's subdomains", function() {
        expect(view.options.subdomains).toEqual(substitute.subdomains);
      });

      it("shouldn't have an errorTileUrl since gmaps didn't have any", function() {
        expect(view.options.errorTileUrl).toEqual('');
      });

      it("shouldn't use osgeo's TMS setting", function() {
        expect(view.options.tms).toEqual(false);
      });
    });
  });

});


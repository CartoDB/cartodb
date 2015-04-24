
describe("Overlay", function() {


  it("should register and create a type", function() {
    var _data;
    cdb.vis.Overlay.register('test', function(data) {
      _data = data;
      return new cdb.core.View();
    });

    var opt = {a : 1, b:2, pos: [10, 20]};
    var v = cdb.vis.Overlay.create('test', null, opt);
    expect(_data).toEqual(opt);

  });

});

describe("Vis", function() {

  beforeEach(function(){
    this.container = $('<div>').css('height', '200px');
    this.mapConfig = {
      updated_at: 'cachebuster',
      title: "irrelevant",
      url: "http://cartodb.com",
      center: [40.044, -101.95],
      bounding_box_sw: [20, -140],
      bounding_box_ne: [ 55, -50],
      zoom: 4,
      bounds: [
        [1, 2],
        [3, 4],
      ]
    };

    this.vis = new cdb.vis.Vis({el: this.container});
    this.vis.load(this.mapConfig);

  })

  it("should insert  default max and minZoom values when not provided", function() {
    expect(this.vis.mapView.map_leaflet.options.maxZoom).toEqual(20);
    expect(this.vis.mapView.map_leaflet.options.minZoom).toEqual(0);
  });


  it("should insert user max and minZoom values when provided", function() {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.maxZoom = 10;
    this.mapConfig.minZoom = 5;
    this.vis.load(this.mapConfig);

    expect(this.vis.mapView.map_leaflet.options.maxZoom).toEqual(10);
    expect(this.vis.mapView.map_leaflet.options.minZoom).toEqual(5);
  })


  it("should insert the max boundaries when provided", function() {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.bounding_box_sw = [1,2];
    this.mapConfig.bounding_box_ne = [3,5];
    this.vis.load(this.mapConfig);

    expect(this.vis.map.get('bounding_box_sw')).toEqual([1,2]);
    expect(this.vis.map.get('bounding_box_ne')).toEqual([3,5]);
  })

  it("should parse center if values are correct", function() {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      center_lat: 43.3,
      center_lon: "89"
    }
    this.vis.load(this.mapConfig, opts);

    expect(this.mapConfig.center[0]).toEqual(43.3);
    expect(this.mapConfig.center[1]).toEqual(89.0);
  })

  it("should not parse center if values are not correct", function() {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      center_lat: 43.3,
      center_lon: "ham"
    }
    this.vis.load(this.mapConfig, opts);

    expect(this.mapConfig.center[0]).not.toEqual(43.3);
    expect(this.mapConfig.center[1]).not.toEqual("ham");
  })
  
  it("should parse bounds values if they are correct", function() {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: 12,
      ne_lon: "0"
    }
    this.vis.load(this.mapConfig, opts);

    expect(this.mapConfig.bounds[0][0]).toEqual(43.3);
    expect(this.mapConfig.bounds[0][1]).toEqual(12);
    expect(this.mapConfig.bounds[1][0]).toEqual(12);
    expect(this.mapConfig.bounds[1][1]).toEqual(0);
  })

  it("should not parse bounds values if they are not correct", function() {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: "jamon",
      ne_lon: "0"
    }
    this.vis.load(this.mapConfig, opts);

    expect(this.mapConfig.bounds[0][0]).not.toEqual(43.3);
    expect(this.mapConfig.bounds[0][1]).not.toEqual(12);
    expect(this.mapConfig.bounds[1][0]).not.toEqual(12);
    expect(this.mapConfig.bounds[1][1]).not.toEqual(0);
  })

  it("should create a google maps map when provider is google maps", function() {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.map_provider = "googlemaps";
    this.vis.load(this.mapConfig);
    expect(this.vis.mapView.map_googlemaps).not.toEqual(undefined);
  });

  it("should not invalidate map if map height is 0", function(done) {
    var container = $('<div>').css('height', '0');
    var vis = new cdb.vis.Vis({el: container});
    this.mapConfig.map_provider = "googlemaps";

    vis.load(this.mapConfig);

    setTimeout(function () {
      spyOn(vis.mapView, 'invalidateSize');
      expect(vis.mapView.invalidateSize).not.toHaveBeenCalled();
      done();
    }, 4000);
  });

  it("should bind resize changes when map height is 0", function() {
    var container = $('<div>').css('height', '0');
    var vis = new cdb.vis.Vis({el: container});
    spyOn(vis, '_onResize');

    this.mapConfig.map_provider = "googlemaps";
    vis.load(this.mapConfig);
    $(window).trigger('resize');
    expect(vis._onResize).toHaveBeenCalled();
    expect(vis.mapConfig).toBeDefined();
  });

  it("shouldn't bind resize changes when map height is greater than 0", function() {
    var container = $('<div>').css('height', '200px');
    var vis = new cdb.vis.Vis({el: container});
    spyOn(vis, '_onResize');

    this.mapConfig.map_provider = "googlemaps";
    vis.load(this.mapConfig);
    $(window).trigger('resize');
    expect(vis._onResize).not.toHaveBeenCalled();
    expect(vis.center).not.toBeDefined();
  });


  it("should pass map to overlays", function() {
    var _map;
    cdb.vis.Overlay.register('jaja', function(data, vis){
      _map = vis.map
      return new cdb.core.View()
    })
    var vis = new cdb.vis.Vis({el: this.container});
    this.mapConfig.overlays = [ {type: 'jaja'}];
    vis.load(this.mapConfig);
    expect(_map).not.toEqual(undefined);
  });

  it("when https is false all the urls should be transformed to http", function() {
    this.vis.https = false;
    this.mapConfig.layers = [{
      kind: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }]
    this.vis.load(this.mapConfig);
    expect(this.vis.map.layers.at(0).get('urlTemplate')).toEqual(
        'http://a.tiles.mapbox.com/v3/{z}/{x}/{y}.png'
    )
  });

  it("should return the native map obj", function() {
    expect(this.vis.getNativeMap()).toEqual(this.vis.mapView.map_leaflet);
  })

  it("load should call done", function(done) {
    this.mapConfig.layers = [{
      kind: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }]
    layers = null;

    this.vis.load(this.mapConfig, { }).done(function(vis, lys){  layers = lys;});

    setTimeout(function() {
      expect(layers.length).toEqual(1);
      done();
    }, 100);

  });

  it("should add header", function() {

    this.mapConfig.title = "title";

    this.vis.load(this.mapConfig, {
      title: true
    });
    expect(this.vis.$('.cartodb-header').length).toEqual(1);
  });

  it("should add layer selector", function() {
    this.vis.load(this.mapConfig, {
      title: true,
      layer_selector: true
    });
    expect(this.vis.$('.cartodb-layer-selector-box').length).toEqual(1);
  });

  it("should add share", function() {
    this.vis.load(this.mapConfig, {
      shareable: true
    });
    expect(this.vis.$('.cartodb-share').length).toEqual(1);
  });

  it("should add header without link in the title", function() {
    var mapConfig = _.clone(this.mapConfig);
    mapConfig.title = "title"
    mapConfig.url = null;

    this.vis.load(mapConfig, {
      title: true
    });

    expect(this.vis.$('.cartodb-header').length).toEqual(1);
    expect(this.vis.$('.cartodb-header h1 > a').length).toEqual(0);
  });

  it("should add zoom", function() {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig);
    expect(this.vis.$('.cartodb-zoom').length).toEqual(1);
  });

  it("should enable zoom if it's specified by zoomControl option", function() {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig, {
      zoomControl: true
    });
    expect(this.vis.$('.cartodb-zoom').length).toEqual(1);
  });

  it("should disable zoom if it's specified by zoomControl option", function() {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig, {
      zoomControl: false
    });
    expect(this.vis.$('.cartodb-zoom').length).toEqual(0);
  });

  it("should add search", function() {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig);
    expect(this.vis.$('.cartodb-searchbox').length).toEqual(1);
  });

  it("should enable search if it's specified by searchControl", function() {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig, {
      searchControl: true
    });
    expect(this.vis.$('.cartodb-searchbox').length).toEqual(1);
  });

  it("should disable search if it's specified by searchControl", function() {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig, {
      searchControl: false
    });
    expect(this.vis.$('.cartodb-searchbox').length).toEqual(0);
  });

  it("should use zoom", function() {
    this.vis.load(this.mapConfig, {
      zoom: 10,
      bounds: [[24.206889622398023,-84.0234375],[76.9206135182968,169.1015625]]
    });
    expect(this.vis.map.getZoom()).toEqual(10);
  });


  it("should retrieve the overlays of a given type", function() {
    var v = this.vis.addOverlay({
      type: 'tooltip',
      template: 'test',
      layer: new L.CartoDBGroupLayer({
        layer_definition: {version: '1.0.0', layers: [] }
      })
    });
    var v1 = this.vis.addOverlay({
      type: 'tooltip',
      template: 'test',
      layer: new L.CartoDBGroupLayer({
        layer_definition: {version: '1.0.0', layers: [] }
      })
    });
    var v2 = this.vis.addOverlay({
      type: 'tooltip',
      template: 'test',
      layer: new L.CartoDBGroupLayer({
        layer_definition: {version: '1.0.0', layers: [] }
      })
    });

    var tooltips = this.vis.getOverlaysByType('tooltip');
    expect(tooltips.length).toEqual(3);
    expect(tooltips[0]).toEqual(v);
    expect(tooltips[1]).toEqual(v1);
    expect(tooltips[2]).toEqual(v2);
    v.clean();
    v1.clean();
    v2.clean();
    expect(this.vis.getOverlaysByType("tooltip").length).toEqual(0);
  });

  describe('addOverlay', function() {

    it("should throw an error if no layers are available", function() {
      expect(function() {
        this.vis.addOverlay({
          type: 'tooltip',
          template: 'test'
        })
      }.bind(this)).toThrow(new Error("layer is null"));
    });

    it("should add an overlay to the specified layer and enable interaction", function() {
      var layer = new L.CartoDBGroupLayer({
        layer_definition: {version: '1.0.0', layers: [] }
      });

      var tooltip = this.vis.addOverlay({
        type: 'tooltip',
        template: 'test',
        layer: layer
      });

      expect(tooltip.options.layer).toEqual(layer);
      expect(layer.interactionEnabled).toEqual([true]);
    });

    it("should add an overlay to the first layer and enable interaction", function(done) {
      var layer;
      var vizjson = {
        layers: [
          {
            type: 'tiled',
            options: {
              urlTemplate: ''
            }
          },
          {
            type: 'layergroup',
            options: {
              layer_definition: {
                layers: []
              }
            }
          }
        ]
      };
      cartodb.createVis('map', vizjson, {})
        .done(function(vis, layers) {
          var tooltip = vis.addOverlay({
            type: 'tooltip',
            template: 'test'
          });
          var layer = vis.getLayers()[1];

          expect(tooltip.options.layer).toEqual(layer);
          expect(layer.interactionEnabled).toEqual([true]);

          done();
        });
    });

  });

  it ("should load modules", function(done) {
    // var self = this;
    console.log(this.vis);
    this.mapConfig.layers = [
      {kind: 'torque', options: { tile_style: 'test', user_name: 'test', table_name: 'test'}}
    ];

    this.vis.load(this.mapConfig);
    
    setTimeout(function() {
      var scripts = document.getElementsByTagName('script'),
          torqueRe = /\/cartodb\.mod\.torque\.js/;
      var found = false;
      for (i = 0, len = scripts.length; i < len && !found; i++) {
        src = scripts[i].src;
        found = !!src.match(torqueRe);
      }
      expect(found).toEqual(true);
      done()
    }, 20);
  });

  it ("should force GMaps", function() {
    this.mapConfig.map_provider = "leaflet";
    this.mapConfig.layers = [{
      kind: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }]

    var opts = {
      gmaps_base_type: 'dark_roadmap'
    };

    layers = null;
    
    this.vis.load(this.mapConfig, opts);
    expect(this.vis.map.layers.at(0).get('type')).toEqual('GMapsBase');
  });

});

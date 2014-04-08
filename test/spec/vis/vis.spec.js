
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

  it("should not invalidate map if map height is 0", function() {
    var container = $('<div>').css('height', '0');
    var vis = new cdb.vis.Vis({el: container});
    this.mapConfig.map_provider = "googlemaps";

    vis.load(this.mapConfig);

    waitsFor(function() {
      return vis.mapView;
    }, "MapView element never created :(", 10000);

    runs(function () {
      spyOn(vis.mapView, 'invalidateSize');
      expect(vis.mapView.invalidateSize).not.toHaveBeenCalled();
    });
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

  it("load should call done", function() {
    this.mapConfig.layers = [{
      kind: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }]
    layers = null;
    runs(function() {
      this.vis.load(this.mapConfig, { }).done(function(vis, lys){  layers = lys;});
    })
    waits(100);
    runs(function() {
      expect(layers.length).toEqual(1);
    });

  });

  it("should add header", function() {

    this.mapConfig.title = "title";

    this.vis.load(this.mapConfig, {
      title: true
    });
    expect(this.vis.$('.cartodb-header').length).toEqual(1);
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

  it("should use zoom", function() {
    this.vis.load(this.mapConfig, {
      zoom: 10,
      bounds: [[24.206889622398023,-84.0234375],[76.9206135182968,169.1015625]]
    });
    expect(this.vis.map.getZoom()).toEqual(10);
  });


  it("should add an overlay", function() {
    var v = this.vis.addOverlay({
      type: 'tooltip',
      template: 'test',
      layer: new L.CartoDBGroupLayer({
        layer_definition: {version: '1.0.0', layers: [] }
      })
    });
    expect(this.vis.getOverlay('tooltip')).toEqual(v);
    expect(this.vis.getOverlays().length).toEqual(1);
    v.clean();
    expect(this.vis.getOverlays().length).toEqual(0);
  });

  it ("should load modules", function() {
    var self = this;
    this.mapConfig.layers = [
      {kind: 'torque', options: { tile_style: 'test', user_name: 'test', table_name: 'test'}}
    ];
    runs(function() {
      self.vis.load(this.mapConfig);
    })
    waits(20);
    runs(function() {
      var scripts = document.getElementsByTagName('script'),
          torqueRe = /\/cartodb\.mod\.torque\.js/;
      var found = false;
      for (i = 0, len = scripts.length; i < len && !found; i++) {
        src = scripts[i].src;
        found = !!src.match(torqueRe);
      }
      expect(found).toEqual(true);
    });
  });

});

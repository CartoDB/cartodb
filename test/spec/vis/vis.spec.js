
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


  it("should create a google maps map when provider is google maps", function() {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.map_provider = "googlemaps";
    this.vis.load(this.mapConfig);
    expect(this.vis.mapView.map_googlemaps).not.toEqual(undefined);
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
    this.vis.load(this.mapConfig, {
      title: true
    });
    expect(this.vis.$('.header').length).toEqual(1);
  });
  
  it("should use zoom", function() {
    this.vis.load(this.mapConfig, {
      zoom: 10,
      bounds: [[24.206889622398023,-84.0234375],[76.9206135182968,169.1015625]]
    });
    expect(this.vis.map.getZoom()).toEqual(10);
  });

  it("cartodb layers should include the cache buster", function() {
    this.mapConfig.layers = [{
      kind: 'cartodb',
      options: {
        table_name: 'test'
      }
    }]
    this.vis.load(this.mapConfig);
    expect(this.vis.map.layers.at(0).attributes.extra_params.updated_at).toEqual('cachebuster');
  });


  it("should add an overlay", function() {
    var v = this.vis.addOverlay({
      type: 'tooltip',
      template: 'test'
    });
    expect(this.vis.getOverlay('tooltip')).toEqual(v);
    expect(this.vis.getOverlays().length).toEqual(1);
    v.clean();
    expect(this.vis.getOverlays().length).toEqual(0);
  });

});

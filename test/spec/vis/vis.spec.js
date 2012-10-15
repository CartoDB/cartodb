
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
      title: "irrelevant",
      center: [40.044, -101.95],
      bounding_box_sw: [20, -140],
      bounding_box_ne: [ 55, -50],
      zoom: 4
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


  xit("should insert the max boundaries when provided", function() {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.bounding_box_sw = [1,2];
    this.mapConfig.bounding_box_ne = [3,5];
    this.vis.load(this.mapConfig);

    expect(this.vis.map.get('bounding_box_sw')).toEqual([1,2]);
    expect(this.vis.map.get('bounding_box_ne')).toEqual([3,5]);
    expect(this.vis.mapView.map_leaflet.options.maxBounds).toBeTruthy();
    expect(this.vis.mapView.map_leaflet.options.maxBounds.getNorthEast().lat).toEqual(3);
    expect(this.vis.mapView.map_leaflet.options.maxBounds.getNorthEast().lng).toEqual(5);
    expect(this.vis.mapView.map_leaflet.options.maxBounds.getSouthWest().lat).toEqual(1);
    expect(this.vis.mapView.map_leaflet.options.maxBounds.getSouthWest().lng).toEqual(2);
  })

})

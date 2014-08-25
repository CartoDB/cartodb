

describe('cdb.admin.Slide', function() {

  var map, slide;
  beforeEach(function() {
    map = new cdb.admin.Map({ id: 'map_0' });
    map.layers.add(new cdb.admin.CartoDBLayer({ id: 'layer_0' }));
    map.layers.add(new cdb.admin.CartoDBLayer({ id: 'layer_1' }));
    map.layers.add(new cdb.geo.TileLayer({ id: 'baselayer_0' }));
    map.layers.at(0).table.set('geometry_types', ['st_point']);
    map.layers.at(1).table.set('geometry_types', ['st_point']);
    slide = new cdb.admin.Slide();
    slide.set('map', map);
  });

  it("should save map state on change", function() {
    var center = [10, 20];
    map.set('center', center);
    expect(slide.get('map_0').center).not.toEqual(center);
    slide.set('active', true);
    center = [10, 80];
    map.set('center', center);
    map.set('zoom', 30);
    expect(slide.get('map_0').center).toEqual(center);
    expect(slide.get('map_0').zoom).toEqual(30);
  });

  it("should change map state on change", function() {
    var center = [20, 30];
    slide.copyAttr(map, { 'center': center });
    slide.set('active', true);
    expect(map.get('center')).toEqual(center);
  });

  describe("cdb.admin.Slide.layers", function() {

    it("should track layers state", function() {
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test');
      expect(slide.getObjState(lyr).tile_style).toEqual('test');
      slide.set('active', false);
      lyr.set('tile_style', 'test2');
      slide.set('active', true);
      expect(slide.getObjState(lyr).tile_style).toEqual('test');
      lyr.wizard_properties.active('density');
      expect(slide.getObjState(lyr).wizard_properties.type).toEqual('density');
      slide.set('active', false);
      lyr.wizard_properties.active('polygon');
      slide.set('active', true);
      expect(lyr.wizard_properties.get('type')).toEqual('density');
    });

    it("should track wizard props", function(done) {
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.wizard_properties.active('polygon');
      lyr.set({ tile_style: 'test', tile_style_custom: true });
      slide.set('active', false);
      lyr.wizard_properties.active('density');
      slide.set('active', true);
      expect(lyr.get('tile_style_custom')).toEqual(true);
      expect(lyr.get('tile_style')).toEqual('test');
      setTimeout(function() {
        //expect(lyr.get('tile_style')).toEqual('test');
        done();
      }, 1000)
    });

  });


});

describe('cdb.admin.Slides', function() {

  var slides, map;
  beforeEach(function() {
    map = new cdb.admin.Map({ id: 'map_0' });
    slides = new cdb.admin.Slides(null, {
      map: map
    });
  });

  it ("should create slides with map instance", function() {
    slides.reset([{}, {test: 1}]);
    expect(slides.at(0).get('map')).toEqual(map);
    expect(slides.at(1).get('map')).toEqual(map);
    slides.add({});
    expect(slides.at(2).get('map')).toEqual(map);
  });

  it("should active slide", function() {
    slides.reset([{}, {test: 1}]);
    slides.setActive(slides.at(0));
    expect(slides.at(0).isActive()).toEqual(true);
    expect(slides.at(1).isActive()).toEqual(false);
    slides.setActive(slides.at(1));
    expect(slides.at(0).isActive()).toEqual(false);
    expect(slides.at(1).isActive()).toEqual(true);
  });
});

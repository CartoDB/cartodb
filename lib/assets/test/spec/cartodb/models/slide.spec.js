

describe('cdb.admin.Slide', function() {

  var map, slide;
  beforeEach(function() {
    map = new cdb.admin.Map();
    map.layers.add(new cdb.admin.CartoDBLayer());
    map.layers.add(new cdb.admin.CartoDBLayer());
    map.layers.at(0).table.set('geometry_types', ['st_point']);
    map.layers.at(1).table.set('geometry_types', ['st_point']);
    slide = new cdb.admin.Slide();
    slide.set('map', map);
  });

  it("should save map state on change", function() {
    var center = [10, 20];
    map.set('center', center);
    expect(slide.get('center')).not.toEqual(center);
    slide.set('active', true);
    center = [10, 80];
    map.set('center', center);
    expect(slide.getForObj(map, 'center')).toEqual(center);
  });

  it("should change map state on change", function() {
    var center = [20, 30];
    slide.setForObj(map, 'center', center);
    slide.set('active', true);
    expect(map.get('center')).toEqual(center);
  });

  it("should track layers state", function() {
    slide.set('active', true);
    var lyr = map.layers.at(0);
    lyr.set('tile_style', 'test');
    expect(slide.getForObj(lyr, 'tile_style')).toEqual('test');
    slide.set('active', false);
    lyr.set('tile_style', 'test2');
    slide.set('active', true);
    expect(lyr.get('tile_style')).toEqual('test');
    debugger
    lyr.wizard_properties.active('density');
    expect(slide.getForObj(lyr, 'wizard_properties').type).toEqual('density');


  });

});

describe('cdb.admin.Slides', function() {

  var slides, map;
  beforeEach(function() {
    map = new cdb.admin.Map();
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


describe("cartodb.models.Map", function() {

  var map;
  beforeEach(function() {
    map = new cdb.admin.Map();
  });

  it("should trigger change:dataLayer when datalayer changes", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.addDataLayer(new cdb.geo.MapLayer());
    expect(s.changed).toHaveBeenCalled();
  });

  it("should trigger change:dataLayer when 2 layers are added", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.layers.add(new cdb.geo.MapLayer());
    map.layers.add(new cdb.geo.MapLayer());
    expect(s.changed).toHaveBeenCalled();
  });

  it("should trigger change:dataLayer when is reset with two layers", function() {
    var s = {
      changed: function() {}
    };
    spyOn(s, 'changed');
    map.bind('change:dataLayer', s.changed);
    map.layers.reset([
      new cdb.geo.MapLayer(),
      new cdb.geo.MapLayer()
    ]);
    expect(s.changed).toHaveBeenCalled();
  });

  /*describe("layer", function() {
    it("parse", function() {
        var layer = new cdb.geo.MapLayer({kind: 'carto', options: {}});
        expect(layer.get('type')).toEqual('CartoDB');
        layer = new cdb.geo.MapLayer({kind: 'tiled', options: {}});
        expect(layer.get('type')).toEqual('Tiled');
    });
  });*/

  describe("layers", function() {
    it("should order with cartodb layers on top of tiled", function() {
      var layers = new cdb.admin.Layers();
      layers.reset([
        new cdb.geo.TileLayer(),
        new cdb.geo.CartoDBLayer()
      ]);
      expect(layers.at(0).get('type')).toEqual('Tiled');
      expect(layers.at(1).get('type')).toEqual('CartoDB');

      layers.reset([
        new cdb.geo.CartoDBLayer(),
        new cdb.geo.TileLayer()
      ]);
      expect(layers.at(0).get('type')).toEqual('Tiled');
      expect(layers.at(1).get('type')).toEqual('CartoDB');

      layers.reset([
        {kind: 'carto', options: {}},
        {kind: 'tiled', options: {}}
      ], { parse: true  });
      expect(layers.at(0).get('type')).toEqual('Tiled');
      expect(layers.at(1).get('type')).toEqual('CartoDB');
    });
  });

});

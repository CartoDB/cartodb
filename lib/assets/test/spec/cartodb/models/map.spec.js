
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

  it('should change provider', function() {
    spyOn(map, 'save');
    map.changeProvider('googlemaps');
    expect(map.save).toHaveBeenCalled();
  });

  it('should not change provider if it is the same', function() {
    spyOn(map, 'save');
    map.changeProvider('leaflet');
    expect(map.save).not.toHaveBeenCalled();
  });

  it('should change the base layer', function() {
    spyOn(map, 'save');
    spyOn(map, 'setBaseLayer');
    sinon.stub(map, 'save', function(data, o) {
      o.success();
    });
    map.changeProvider('leaflet', new cdb.geo.MapLayer());
    expect(map.setBaseLayer).toHaveBeenCalled();
  });

  it('should notice on fail', function() {
    s = sinon.spy();
    spyOn(map, 'setBaseLayer');
    map.bind('notice', s);
    sinon.stub(map, 'save', function(data, o) {
      o.error(null, {responseText: '{"errors":[]}'});
    });
    map.changeProvider('gmaps', new cdb.geo.MapLayer());
    expect(map.setBaseLayer).not.toHaveBeenCalled();
    expect(s.called).toEqual(true);
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

    it("should create the right type", function() {
      var layers = new cdb.admin.Layers();
      layers.reset([
        {kind: 'carto', options: {}}
        //{kind: 'tiled', options: {}}
      ], { parse: true  });
      //expect(typeof(layers.at(0))).toEqual(cdb.geo.TileLayer);
      expect(layers.at(0).undoStyle).not.toEqual(undefined);
    });

    it("should remove api key in toJSON", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.set({ extra_params: {
        'map_key': 'test',
        'api_key': 'test',
        'dummy': 'test2'
      }});
      expect(_.keys(layer.toJSON().options.extra_params).length).toEqual(1);

    });

    it("should include infowindow in toJSON", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.set({ 
        infowindow: 'test'
      });
      expect(layer.toJSON().infowindow).toEqual('test');
    });

    it("should add api key when parse", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.set({ extra_params: {
        'map_key': 'test',
        'api_key': 'test',
        'dummy': 'test2'
      }});

      var a = layer.parse({ 
        type: 'Layer::Carto',
        options: {
          extra_params: {
          'dummy': 'test2'
          }
        }
      });

      expect(a.extra_params.map_key).not.toEqual(undefined);

    });

  });

  describe('CartoDBLayer', function() {
    var layer;
    beforeEach(function() {
      layer  = new cdb.admin.CartoDBLayer();
    });

    it("when reset the current style shold be the latest", function() {
      layer.set({
        tile_style: '0',
        tile_style_history: ['1','2','3','4']
      });
      expect(layer.tile_style_history_position).toEqual(layer.get('tile_style_history').length - 1);
    });

    it("should save style history", function() {
      expect(layer.get('tile_style_history').length).toEqual(0);
      layer.set({ tile_style: 'test'});
      expect(layer.get('tile_style_history').length).toEqual(1);
      layer.set({ tile_style: 'test'});
      expect(layer.get('tile_style_history').length).toEqual(1);
      layer.set({ tile_style: 'test2'});
      expect(layer.get('tile_style_history').length).toEqual(2);
      expect(layer.get('tile_style_history')[0]).toEqual('test');
      layer.set({ tile_style: 'test3'});
      expect(layer.get('tile_style_history')[0]).toEqual('test');
      expect(layer.get('tile_style_history')[1]).toEqual('test2');
      expect(layer.get('tile_style_history')[2]).toEqual('test3');
    });

    it("should undo and redo style history", function() {
      layer.set({ tile_style: 'initial'});
      layer.set({ tile_style: 'test'});
      layer.set({ tile_style: 'test2'});
      expect(layer.get('tile_style')).toEqual('test2');
      layer.undoStyle();
      expect(layer.get('tile_style')).toEqual('test');
      layer.undoStyle();
      expect(layer.get('tile_style')).toEqual('initial');
      layer.undoStyle();
      expect(layer.get('tile_style')).toEqual('initial');
      layer.redoStyle();
      expect(layer.get('tile_style')).toEqual('test');
      layer.redoStyle();
      expect(layer.get('tile_style')).toEqual('test2');
      layer.redoStyle();
      expect(layer.get('tile_style')).toEqual('test2');
    });

    it("should not save more than MAX_HISTORY", function() {
      for(var i = 0; i < layer.MAX_HISTORY + 1; ++i) {
        layer.set({ tile_style: 'test' + i});
      }
      expect(layer.get('tile_style_history').length).toEqual(layer.MAX_HISTORY);

    });

    it("should save the style to the tiler before call change", function() {
      spyOn(layer, 'saveStyle');
      layer.url = function() { return 'test' };
      layer.save({tile_style: 'blbla'});
      expect(layer.saveStyle).toHaveBeenCalled();
    });
    it("should call save with wait=true when tile_style is saved", function() {

      spyOn(cdb.geo.CartoDBLayer.prototype, 'save');
      layer.saveStyle = function(a, b, done) {
        done();
      }
      layer.save({tile_style: 'blbla'});
      expect(cdb.geo.CartoDBLayer.prototype.save).toHaveBeenCalled();
      expect(cdb.geo.CartoDBLayer.prototype.save.mostRecentCall.args[1]).toEqual({wait: true});
    });
  });

});

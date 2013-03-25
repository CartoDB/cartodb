
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
      expect(layers.at(0).undoHistory).not.toEqual(undefined);
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
    afterEach(function() {
      delete localStorage['test_storage_'+layer.get('table_name')]
    })

    it("should initialize history", function() {
      layer.initHistory('test');
      expect(layer.get('test_history').length).toEqual(0);
      expect(layer.test_history_position).toEqual(0);
    })

    it("should be able to update history", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      expect(layer.get('test_history').length).toEqual(1);
      expect(layer.get('test_history')[0]).toEqual('test1');
    })

    it("should trim the history when limit is reached", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      expect(layer.get('test_history').length).toEqual(3);
      expect(layer.get('test_history')[0]).toEqual('test2');
    });

    it("should save on localStorage the history when limit is reached", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      expect(localStorage.getItem('test_storage_'+layer.get('table_name'))).toEqual('["test1"]');
    });

    it("should detect if it's on the last history position", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      expect(layer.isHistoryAtLastPosition('test')).toBeTruthy();
    })

    it("should detect if it's not on the last history position after browse", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.undoHistory('test');
      expect(layer.isHistoryAtLastPosition('test')).toBeFalsy();
    })
    it("should detect if it's on the last history position after browse and back", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.undoHistory('test');
      layer.redoHistory('test');
      expect(layer.isHistoryAtLastPosition('test')).toBeTruthy();
    })


    it("should detect if it's not the first history position", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      expect(layer.isHistoryAtFirstPosition('test')).toBeFalsy();
    })

    it("should detect if it's on the first history position", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.undoHistory('test')
      expect(layer.isHistoryAtFirstPosition('test')).toBeTruthy();
    })


    it("should detect if it's not the first history position when there's local storage and user has browse after 0 pos", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      expect(layer.isHistoryAtFirstPosition('test')).toBeFalsy();
    })

    it("should detect if it's not the first history position when there's local storage and user has browse after 0 pos", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      layer.undoHistory('test')
      layer.undoHistory('test')
      expect(layer.isHistoryAtFirstPosition('test')).toBeFalsy();
    })


    it("should detect if it's on the first history position when there's local storage", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      layer.undoHistory('test')
      layer.undoHistory('test')
      layer.undoHistory('test')
      expect(layer.isHistoryAtFirstPosition('test')).toBeTruthy();
    })

    it("should not save a new style if it's the same than previous one", function() {
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test1');
      expect(layer.get('test_history').length).toEqual(1);
    });

    it("should undo tile_style history", function() {
      layer.initHistory('tile_style');
      layer.addToHistory('tile_style', 'test1');
      layer.addToHistory('tile_style', 'test2');
      layer.addToHistory('tile_style', 'test3');
      layer.set({ test: 'test3'});

      var data = layer.undoHistory('tile_style');
      expect(layer.getCurrentHistoryPosition('tile_style')).toEqual('test2');
    });


    it("should undo history and get it from localStorage", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');

      var data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');

      expect(layer.getCurrentHistoryPosition('test')).toEqual('test1');
    });


    it("should return first history if you undo more than the length", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');

      var data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');

      expect(layer.getCurrentHistoryPosition('test')).toEqual('test1');
    });

    it("should return first history if you undo more than the length also from localStorage", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');

      var data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');
      data = layer.undoHistory('test');

      expect(layer.getCurrentHistoryPosition('test')).toEqual('test1');
    });

    it("should redo tile_style history", function() {
      layer.initHistory('tile_style');
      layer.addToHistory('tile_style', 'test1');
      layer.addToHistory('tile_style', 'test2');
      layer.addToHistory('tile_style', 'test3');
      layer.set({ test: 'test3'});

      layer.undoHistory('tile_style');
      layer.redoHistory('tile_style');
      expect(layer.getCurrentHistoryPosition('tile_style')).toEqual('test3');
    });


    it("should undo to localstorage and redo to persisted history flawless", function() {
      layer.MAX_HISTORY_TEST = 3
      layer.initHistory('test');
      layer.addToHistory('test', 'test1');
      layer.addToHistory('test', 'test2');
      layer.addToHistory('test', 'test3');
      layer.addToHistory('test', 'test4');
      layer.addToHistory('test', 'test5');

      var data = layer.undoHistory('test'); //test4
      data = layer.undoHistory('test');//test3
      data = layer.undoHistory('test');//test2
      data = layer.undoHistory('test');//test1
      data = layer.redoHistory('test');//test2
      data = layer.redoHistory('test');//test3
      data = layer.redoHistory('test');//test4
      data = layer.redoHistory('test');//test5

      expect(layer.getCurrentHistoryPosition('test')).toEqual('test5');
    });


    it("should increment cache buster", function() {
      var c = layer.get('extra_params').cache_buster;
      layer.updateCacheBuster();
      var c2 = layer.get('extra_params').cache_buster;
      expect(c).not.toEqual(c2);
    });

    it("should not save more than MAX_HISTORY_TILE_STYLE", function() {
      for(var i = 0; i < layer.MAX_HISTORY_TILE_STYLE + 1; ++i) {
        layer.addToHistory('tile_style', 'test' + i);
      }
      expect(layer.get('tile_style_history').length).toEqual(layer.MAX_HISTORY_TILE_STYLE);

    });

    it("should bind to sqlView", function() {
      var sqlView = new cdb.admin.SQLViewData();
      layer.bindSQLView(sqlView);
      layer.set('query', 'test');
      spyOn(layer, 'save')
      sqlView.trigger('error');
      expect(layer.save).toHaveBeenCalledWith({query: null}, {silent: true});

      sqlView.modify_rows = true;
      layer.set('query', 'test');
      spyOn(layer, 'invalidate');
      sqlView.trigger('reset');
      expect(layer.get('query')).toEqual(null);
      expect(layer.invalidate).toHaveBeenCalled();

      sqlView.modify_rows = false;
      layer.set('query', 'test');
      sqlView.options.set('sql', 'testsql')
      sqlView.trigger('reset');
      expect(layer.save).toHaveBeenCalledWith({query: 'testsql'});

    })
  });

});

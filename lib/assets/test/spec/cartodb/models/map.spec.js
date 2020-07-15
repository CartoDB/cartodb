describe("cartodb.models.Map", function() {

  var map, layers;
  beforeEach(function() {
    map = new cdb.admin.Map();
    layers = new cdb.admin.Layers();
  });

  var DEFAULT_CARTO_ATTRIBUTION = '© <a href="https://carto.com/about-carto/" target="_blank">CARTO</a>';

  it("should clone", function() {
    var layer = new cdb.geo.CartoDBLayer();
    layers.add(layer);
    var copy = layers.clone();
    expect(copy.size()).toEqual(layers.size());
    var a = _.clone(layers.models[0].attributes);
    delete a.id;
    expect(copy.models[0].attributes).toEqual(a);
    expect(copy.get('id')).toEqual(undefined);
  });

  it("should not change bounds according to base layer", function() {
    var layer = new cdb.geo.TileLayer({
      maxZoom: 8,
      minZoom: 7,
      type: 'Tiled',
      urlTemplate: 'x',
      base_type: 'x',
      name: 'Positron'
    });
    map.addLayer(layer);
    expect(map.get('maxZoom')).toEqual(8);
    expect(map.get('minZoom')).toEqual(7);
    var layerbase = new cdb.geo.TileLayer({
      maxZoom: 10,
      minZoom: 9,
      type: 'Tiled',
      urlTemplate: 'y',
      base_type: 'y',
      name: 'Dark Matter'
    });
    sinon.stub(layerbase, "save").yieldsTo("success");
    map.setBaseLayer(layerbase);
    expect(map.get('maxZoom')).toEqual(10);
    expect(map.get('minZoom')).toEqual(9);
  });

  describe('.setBaseLayer', function() {

    var savingLayersFinish;

    it('should set the base layer as the first layer', function(done) {
      savingLayersFinishCallback = jasmine.createSpy('savingLayersFinishCallback');
      map.bind('savingLayersFinish', savingLayersFinishCallback);

      var baseLayer = new cdb.geo.CartoDBLayer({
        id: 'XXX-YYY',
        attribution: 'CartoDB1.0',
        type: 'Tiled',
        urlTemplate: 'x',
        base_type: 'x',
        name: 'Positron'
      });
      sinon.stub(baseLayer, "save").yieldsTo("success");

      map.setBaseLayer(baseLayer);

      var newBaseLayer = map.layers.at(0);
      expect(map.layers.length).toEqual(1);
      expect(newBaseLayer).toEqual(baseLayer);
      setTimeout(function() {
        expect(newBaseLayer.get('id')).toEqual('XXX-YYY');
        expect(newBaseLayer.get('order')).toEqual(0);
        expect(baseLayer.save.called).toBeTruthy();
        expect(savingLayersFinishCallback.calls.count()).toEqual(1);
        done();
      }, 0);
      expect(map.get('attribution')).toEqual([ 'CartoDB1.0', DEFAULT_CARTO_ATTRIBUTION ]);
    })

    it('should update the existing base layer if the new layer has the same type', function(done) {
      var baseLayer = new cdb.geo.TileLayer({
        id: 'XXX-YYY',
        attribution: 'CartoDB1.0',
        urlTemplate: 'x',
        base_type: 'x',
        name: 'Positron'
      });
      sinon.stub(baseLayer, "save").yieldsTo("success");

      var newBaseLayer = new cdb.geo.TileLayer({
        attribution: 'CartoDB2.0',
        urlTemplate: 'y',
        base_type: 'y',
        name: 'Dark Matter'
      });

      map.setBaseLayer(baseLayer);

      savingLayersFinishCallback = jasmine.createSpy('savingLayersFinishCallback');
      map.bind('savingLayersFinish', savingLayersFinishCallback);

      map.setBaseLayer(newBaseLayer);

      expect(map.layers.at(0).isEqual(newBaseLayer)).toBeTruthy();
      setTimeout(function() {
        expect(map.layers.at(0).get('id')).toEqual('XXX-YYY');
        expect(map.layers.at(0).get('order')).toEqual(0);
        expect(map.layers.at(0).get('name')).toEqual('Dark Matter');
        expect(baseLayer.save.called).toBeTruthy();
        expect(savingLayersFinishCallback.calls.count()).toEqual(1);
        done();
      }, 0);
      expect(map.get('attribution')).toEqual([ 'CartoDB2.0', DEFAULT_CARTO_ATTRIBUTION ]);
      expect(map.layers.length).toEqual(1);
    })

    it('should replace the base layer if the current base layer has a different type', function(done) {
      var baseLayer = new cdb.admin.CartoDBLayer({
        id: 'XXX-YYY',
        attribution: 'CartoDB1.0',
        tile_style: 'test1',
        query: 'sql1',
        interactivity: 'int1',
        visible: true
      });
      sinon.stub(baseLayer, "save").yieldsTo("success");

      var newBaseLayer = new cdb.geo.TileLayer({
        id: 'ZZZ-YYY',
        attribution: 'CartoDB2.0',
        urlTemplate: 'y',
        base_type: 'y',
        name: 'Positron'
      });
      sinon.stub(newBaseLayer, "save").yieldsTo("success");

      map.setBaseLayer(baseLayer);

      expect(map.get('attribution')).toEqual([ 'CartoDB1.0', DEFAULT_CARTO_ATTRIBUTION ]);

      savingLayersFinishCallback = jasmine.createSpy('savingLayersFinishCallback');
      map.bind('savingLayersFinish', savingLayersFinishCallback);

      map.setBaseLayer(newBaseLayer);

      expect(map.layers.at(0).isEqual(newBaseLayer)).toBeTruthy();
      setTimeout(function() {
        expect(map.layers.at(0).get('id')).toEqual('XXX-YYY');
        expect(map.layers.at(0).get('order')).toEqual(0);
        expect(newBaseLayer.save.called).toBeTruthy();
        expect(savingLayersFinishCallback.calls.count()).toEqual(1);
        done();
      }, 0);
      expect(map.get('attribution')).toEqual([ 'CartoDB2.0', DEFAULT_CARTO_ATTRIBUTION ]);

      expect(map.layers.length).toEqual(1);
    })

    it("shouldn't set base layer if the old base layer is the same", function() {
      var old = new cdb.geo.TileLayer({
        type: 'Tiled',
        urlTemplate: 'x',
        base_type: 'x',
        name: 'Positron'
      });
      var opts = {
        alreadyAdded: function(){ console.log("base layer already added"); }
      };

      var added = false;
      map.bind('savingLayersFinish', function() {
        added = true;
      });

      expect(map.setBaseLayer(old)).not.toBeFalsy();
      expect(map.setBaseLayer(old, opts)).toBeFalsy();
      expect(added).toEqual(true);
    });

    describe('basemaps with labels', function() {

      it('should add a layer with labels at the top if basemap has labels', function(done) {
        var baseLayer = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'CartoDB2.0',
          name: 'Wadus',
          urlTemplate: 'y',
          minZoom: '0',
          maxZoom: '19',
          subdomains: 'abcd',
          visible: true,
          labels: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
          }
        });
        map.setBaseLayer(baseLayer);
        setTimeout(function() {
          expect(map.layers.length).toEqual(2);
          expect(map.layers.at(0).isEqual(baseLayer)).toBeTruthy();
          expect(map.layers.at(1).attributes).toEqual({
            visible: true,
            type: 'Tiled',
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
            attribution: 'CartoDB2.0',
            name: 'Wadus Labels',
            minZoom: '0',
            maxZoom: '19',
            subdomains: 'abcd',
            kind: 'tiled',
            order: 1
          });
          done();
        }, 0);
      })

      it('should remove the layer with labels if new basemap has no labels', function(done) {
        var baseLayerWithLabels = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'CartoDB2.0',
          urlTemplate: 'y',
          minZoom: '0',
          maxZoom: '19',
          subdomains: 'abcd',
          visible: true,
          labels: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
          }
        });

        map.setBaseLayer(baseLayerWithLabels);

        var baseLayerNoLabels = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'CartoDB3.0',
          urlTemplate: 'z',
          minZoom: '0',
          maxZoom: '20',
          subdomains: 'abcd',
          visible: true
        });

        map.setBaseLayer(baseLayerNoLabels);

        setTimeout(function() {
          expect(map.layers.length).toEqual(1);
          expect(map.layers.at(0).isEqual(baseLayerNoLabels)).toBeTruthy();
          done();
        }, 0);
      })

      it('should remove the layer with labels if new basemap is not a Tiled layer', function(done) {
        var baseLayerWithLabels = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'CartoDB2.0',
          urlTemplate: 'y',
          minZoom: '0',
          maxZoom: '19',
          subdomains: 'abcd',
          visible: true,
          labels: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
          }
        });

        map.setBaseLayer(baseLayerWithLabels);

        var baseLayerNoLabels = new cdb.admin.PlainLayer();

        map.setBaseLayer(baseLayerNoLabels);

        setTimeout(function() {
          expect(map.layers.length).toEqual(1);
          expect(map.layers.at(0).isEqual(baseLayerNoLabels)).toBeTruthy();
          done();
        }, 0);
      })

      it('should update layer with labels if previous basemap had labels and new basemap has labels', function(done) {

        var basemapWithLabels1 = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'CartoDB2.0',
          name: 'Basemap 1',
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_no_labels/{z}/{x}/{y}.png',
          minZoom: '0',
          maxZoom: '19',
          subdomains: 'abcd',
          visible: true,
          labels: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'
          }
        });

        map.setBaseLayer(basemapWithLabels1);

        var basemapWithLabels2 = new cdb.admin.TileLayer({
          id: 'ZZZ-YYY',
          attribution: 'newAttribution',
          name: 'Basemap 2',
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_no_labels/{z}/{x}/{y}.png',
          minZoom: 'newMinZoom',
          maxZoom: 'newMaxZoom',
          subdomains: 'newSubdomains',
          visible: true,
          labels: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
          }
        });

        map.setBaseLayer(basemapWithLabels2);

        setTimeout(function() {
          expect(map.layers.length).toEqual(2);
          expect(map.layers.last().attributes).toEqual({
            visible: true,
            type: 'Tiled',
            name: 'Basemap 2 Labels',
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png',
            attribution: 'newAttribution',
            minZoom: 'newMinZoom',
            maxZoom: 'newMaxZoom',
            subdomains: 'newSubdomains',
            kind: 'tiled',
            order: 1
          });
          done();
        }, 0);
      })
    })
  })

  it("should get 0 layers when type is not specified", function() {
    expect(map.layers.getLayersByType()).toBe(0);
    expect(map.layers.getLayersByType('')).toBe(0);
  });

  it("should get the number of CartoDB layers", function() {
    var lyr_1 = new cdb.geo.CartoDBLayer({ urlTemplate:'x', base_type: "x" });
    var lyr_2 = new cdb.geo.CartoDBLayer({ urlTemplate:'y', base_type: "y" });
    map.addLayer(lyr_1);
    map.addLayer(lyr_2);
    expect(map.layers.getLayersByType('CartoDB').length).toBe(2);
  });

  it("should get the number of Tiled layers", function() {
    var lyr_1 = new cdb.geo.CartoDBLayer({ urlTemplate:'x', base_type: "x" });
    var lyr_2 = new cdb.geo.CartoDBLayer({ urlTemplate:'y', base_type: "y" });
    var lyr_3 = new cdb.geo.CartoDBLayer({ maxZoom: 8, minZoom: 7, type: 'Tiled', urlTemplate: 'x', base_type: 'x' });
    map.addLayer(lyr_1);
    map.addLayer(lyr_2);
    map.addLayer(lyr_3);
    expect(map.layers.getLayersByType('Tiled').length).toBe(1);
  });

  it("shouldn't get any layer if this layer type doesn't exist", function() {
    var lyr_1 = new cdb.geo.CartoDBLayer({ urlTemplate:'x', base_type: "x" });
    var lyr_2 = new cdb.geo.CartoDBLayer({ urlTemplate:'y', base_type: "y" });
    var lyr_3 = new cdb.geo.CartoDBLayer({ maxZoom: 8, minZoom: 7, type: 'Tiled', urlTemplate: 'x', base_type: 'x' });
    map.addLayer(lyr_1);
    map.addLayer(lyr_2);
    map.addLayer(lyr_3);
    expect(map.layers.getLayersByType('Jamon').length).toBe(0);
  });

  it("should set base layer", function() {
    var old = new cdb.geo.CartoDBLayer({ urlTemplate:'x', base_type: "x", id: 1 });
    map.addLayer(old);
    var layer    = new cdb.geo.CartoDBLayer({ urlTemplate:'y', base_type: "y", id: 2 });
    map.addLayer(layer);
    var base = new cdb.geo.CartoDBLayer({ urlTemplate:'z', base_type: "z", id: 3 });

    sinon.stub(base, "save").yieldsTo("success");
    var r = map.setBaseLayer(base);
    expect(r).toEqual(base);
    expect(map.layers.at(0).id).not.toEqual(base.id);
    expect(map.layers.at(0).attributes.urlTemplate).toEqual(base.attributes.urlTemplate);
  });

  it("should change layers 'map_id' attribution if map id changes", function() {
    var old = new cdb.geo.CartoDBLayer({});
    map.setCenter([1,0]);
    map.addLayer(old);

    old.sync = function(a, b, opts) {
      opts.success({
        map_id: 68
      }, 200);
    }

    map.set('id', 68);
    expect(map.layers.models[0].url().indexOf('/maps/68/layers') != -1).toEqual(true);
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

  it("should clamp", function() {
    expect(map.set('center', [0, 185]).clamp().get('center')).toEqual([0, -175])
    expect(map.set('center', [0, -185]).clamp().get('center')).toEqual([0, 175])
  });

  it('should update the attribution of the map when layers change', function() {
    var layer1 = new cdb.geo.CartoDBLayer({ attribution: 'attribution1' });
    var layer2 = new cdb.geo.CartoDBLayer({ attribution: 'attribution1' });
    var layer3 = new cdb.geo.CartoDBLayer({ attribution: 'wadus' });
    var layer4 = new cdb.geo.CartoDBLayer({ attribution: '' });

    map.layers.reset([ layer1, layer2, layer3, layer4 ]);

    // Attributions have been updated removing duplicated and empty attributions
    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      DEFAULT_CARTO_ATTRIBUTION
    ]);
  });

  describe("layers", function() {

    it("should add layers on top", function() {
      var layers = new cdb.admin.Layers();
      layers.reset([
        new cdb.geo.TileLayer(),
        new cdb.geo.CartoDBLayer()
      ]);
      var t = new cdb.geo.TorqueLayer();
      t.unset('order');
      layers.add(t);
      expect(layers.at(2).get('type')).toEqual('torque');
    });

    it("should insert cartodb layers before torque layers", function() {
      var layers = new cdb.admin.Layers();
      layers.reset([
        new cdb.geo.TileLayer(),
        new cdb.geo.TorqueLayer(),
      ]);
      var c = new cdb.geo.CartoDBLayer();
      c.unset('order');
      layers.add(c);
      expect(layers.at(0).get('type')).toEqual('Tiled');
      expect(layers.at(1).get('type')).toEqual('CartoDB');
      expect(layers.at(2).get('type')).toEqual('torque');
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
      expect(layer.toJSON().infowindow).toEqual(layer.infowindow.toJSON());
    });

    it("should not include infowindow if wizard doesn's support it", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.wizard_properties = {
        supportsInteractivity: function() { return false },
        toJSON: function() { return {} }
      };
      layer.set({ infowindow: 'test' });
      expect(layer.toJSON().infowindow).toBeNull();
    });

    it("should include legend in toJSON", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.legend.set({ test: 'test' })
      expect(layer.toJSON().options.legend).toEqual(layer.legend.toJSON())
    });

    it("should include tooltip in toJSON", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.tooltip.addField('test');
      //layer.set({ tooltip: layer.tooltip.toJSON() });
      expect(layer.toJSON().tooltip).toEqual(layer.tooltip.toJSON());
    });

    it("should save when tooltip changes", function(done) {
      var layer = new cdb.admin.CartoDBLayer({ id: 1 });
      spyOn(layer, 'save')
      layer.table = TestUtil.createTable("test", [
        ['test', 'number'],
        ['test2', 'string']
      ])
      layer.tooltip.addField('test')//.addField('test2');
      setTimeout(function() {
        expect(layer.save).toHaveBeenCalled();
        expect(layer.toJSON().tooltip).toEqual(layer.tooltip.toJSON())
        done() ;
      }, 300);
    });

    it("should remove missing fields before save", function(done) {
      var layer = new cdb.admin.CartoDBLayer({ id: 1});
      spyOn(layer, 'save')
      layer.table = TestUtil.createTable("test", [
        ['test', 'number'],
        ['test2', 'string']
      ])
      // addd a field not in the schema
      layer.infowindow.addField('rambo')
      layer.infowindow.addField('test')
      layer.infowindow.addField('test2')
      setTimeout(function() {
        expect(layer.save).toHaveBeenCalled()
        expect(layer.save.calls.count()).toEqual(1)
        var fieldNames = _.pluck(layer.toJSON().infowindow.fields, 'name')
        expect(_.contains(fieldNames,'rambo')).toEqual(false);
        expect(_.contains(fieldNames,'test')).toEqual(true);
        expect(_.contains(fieldNames,'test2')).toEqual(true);
        done();
      }, 1000);
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

    it("should add metadata when parse", function() {
      var layer = new cdb.admin.CartoDBLayer();
      layer.set({
        wizard_properties: {
          properties: {
            metadata: 'test'
          }
        }
      }, { silent: true });

      var a = layer.parse({
        type: 'Layer::Carto',
        options: {
          wizard_properties: {
            type: 'polygon',
            properties: { 'dummy': 'test2' }
          }
        }
      });

      expect(a.wizard_properties.properties.metadata).toEqual('test');
    });

    it("should get layer def", function() {
      var layers = new cdb.admin.Layers();
      layers.reset([
        new cdb.geo.TileLayer(),
        new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: true}),
        new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true}),
        new cdb.admin.CartoDBLayer({ tile_style: 'test3', query: 'sql3', interactivity: 'int3', visible: false}),
        new cdb.admin.CartoDBLayer({ tile_style: 'test4', query: 'select * from jaja', query_wrapper: "select i from (<%= sql %>)", interactivity: 'int3', visible: true})
      ]);

      expect(layers.getLayerDef()).toEqual({
        version:'1.0.1',
        layers: [
          {
            type: "cartodb",
            options: {
              sql: 'sql1',
              cartocss: 'test1',
              cartocss_version: '2.1.1',
              interactivity: 'int1'
            }
          },
          {
            type: "cartodb",
            options: {
              sql: 'sql2',
              cartocss: 'test2',
              cartocss_version: '2.1.1',
              interactivity: 'int2'
            }
          },
          {
            type: "cartodb",
            options: {
              sql: 'select i from (select * from jaja)',
              cartocss: 'test4',
              cartocss_version: '2.1.1',
              interactivity: 'int3'
            }
          }
       ]
      })
    });

    it("should get layer def index", function() {
      var layers = new cdb.admin.Layers();
      var layer = new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true});
      var layer2 = new cdb.admin.CartoDBLayer({ tile_style: 'test3', query: 'sql3', interactivity: 'int3', visible: true});
      layers.reset([
        new cdb.geo.TileLayer(),
        new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: false}),
        layer,
        layer2
      ]);

      expect(layers.getLayerDefIndex(layer)).toEqual(0);
      expect(layers.getLayerDefIndex(layer2)).toEqual(1);
    });

    it("should get properly the number of data layers", function() {
      var layers = new cdb.admin.Layers();
      var tiled = new cdb.geo.TileLayer({ type: 'Tiled', urlTemplate: 'x', base_type: 'x' });
      var layer = new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true});
      var layer1 = new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: false});
      var layer2 = new cdb.admin.CartoDBLayer({ tile_style: 'test3', query: 'sql3', interactivity: 'int3', visible: true});
      var layer3 = new cdb.geo.TorqueLayer();

      layers.reset([ tiled, layer, layer1, layer2 ]);
      expect(layers.getTotalDataLayers()).toBe(3);

      layers.reset([layer1, layer3]);
      expect(layers.getTotalDataLayers()).toBe(2);

      layers.reset([tiled, layer3]);
      expect(layers.getTotalDataLayers()).toBe(1);

      layers.reset([tiled]);
      expect(layers.getTotalDataLayers()).toBe(0);

      layers.reset([tiled, layer, layer1, layer2, layer3 ]);
      expect(layers.getTotalDataLayers()).toBe(4);
    })

    it("should get properly the number of data layers with legend applied", function() {
      var layers = new cdb.admin.Layers();
      var tiled = new cdb.geo.TileLayer({ type: 'Tiled', urlTemplate: 'x', base_type: 'x' });
      var layer = new cdb.admin.CartoDBLayer({ tile_style: 'test2', query: 'sql2', interactivity: 'int2', visible: true, legend: { type: '' } });
      var layer1 = new cdb.admin.CartoDBLayer({ tile_style: 'test1', query: 'sql1', interactivity: 'int1', visible: false, legend: { type: 'custom' }});
      var layer2 = new cdb.admin.CartoDBLayer({ tile_style: 'test3', query: 'sql3', interactivity: 'int3', visible: true, legend: {  }});
      var layer3 = new cdb.geo.TorqueLayer({ legend: { type: 'torque' } });

      layers.reset([ tiled, layer, layer1, layer2 ]);
      expect(layers.getTotalDataLegends()).toBe(1);

      layers.reset([layer1, layer3]);
      expect(layers.getTotalDataLegends()).toBe(2);

      layers.reset([tiled, layer3]);
      expect(layers.getTotalDataLegends()).toBe(1);

      layers.reset([tiled]);
      expect(layers.getTotalDataLegends()).toBe(0);

      layers.reset([tiled, layer, layer1, layer2, layer3 ]);
      expect(layers.getTotalDataLegends()).toBe(2);

      layers.reset([ layer, layer2 ]);
      expect(layers.getTotalDataLegends()).toBe(0);
    });

    it('.isLayerOnTopOfDataLayers', function() {
      var layers = new cdb.admin.Layers();
      var layer1 = new cdb.geo.CartoDBLayer();
      var layer2 = new cdb.geo.CartoDBLayer();
      var tileLayer = new cdb.geo.TileLayer();

      layers.add(layer1);

      // There's only one layer so layer1 is on top
      expect(layers.isLayerOnTopOfDataLayers(layer1)).toBeTruthy();

      layers.add(layer2);
      layers.add(tileLayer);

      // layer1 is no longer the data layer on top. layer2 is the layer on top
      expect(layers.isLayerOnTopOfDataLayers(layer1)).toBeFalsy();
      expect(layers.isLayerOnTopOfDataLayers(layer2)).toBeTruthy();
    })


    describe('.moveLayer', function() {

      beforeEach(function() {
        spyOn(Backbone, 'sync');
      })

      it('should reassign orders correctly', function() {
        var layers = new cdb.admin.Layers();
        var tileLayer = new cdb.geo.TileLayer();
        var layer1 = new cdb.geo.CartoDBLayer();
        var layer2 = new cdb.geo.CartoDBLayer();
        var layer3 = new cdb.geo.CartoDBLayer();

        layers.add(tileLayer);
        layers.add(layer1);
        layers.add(layer2);
        layers.add(layer3);

        expect(tileLayer.get('order')).toEqual(0);
        expect(layer1.get('order')).toEqual(1);
        expect(layer2.get('order')).toEqual(2);
        expect(layer3.get('order')).toEqual(3);

        // Move layer3 to position 1
        layers.moveLayer(layer3, { to: 1 });

        expect(tileLayer.get('order')).toEqual(0);
        expect(layer3.get('order')).toEqual(1);
        expect(layer1.get('order')).toEqual(2);
        expect(layer2.get('order')).toEqual(3);

        // Move layer3 to position 2
        layers.moveLayer(layer3, { to: 2 });

        expect(tileLayer.get('order')).toEqual(0);
        expect(layer1.get('order')).toEqual(1);
        expect(layer3.get('order')).toEqual(2);
        expect(layer2.get('order')).toEqual(3);

        // Move layer1 to position 3
        layers.moveLayer(layer1, { to: 3 });

        expect(tileLayer.get('order')).toEqual(0);
        expect(layer3.get('order')).toEqual(1);
        expect(layer2.get('order')).toEqual(2);
        expect(layer1.get('order')).toEqual(3);
      });

      it('should trigger a reset event', function(done) {
        var layers = new cdb.admin.Layers();
        var tileLayer = new cdb.geo.TileLayer();
        var layer1 = new cdb.geo.CartoDBLayer();
        var layer2 = new cdb.geo.CartoDBLayer();

        layers.add(tileLayer);
        layers.add(layer1);
        layers.add(layer2);

        var callback = jasmine.createSpy('callback');
        layers.bind('reset', callback);

        layers.moveLayer(layer1, { to: 2 });

        setTimeout(function() {
          expect(callback).toHaveBeenCalled();
          expect(callback.calls.count()).toEqual(1);
          done();
        }, 0);
      })

      it('should save layers', function(done) {
        var layers = new cdb.admin.Layers();
        var tileLayer = new cdb.geo.TileLayer();
        var layer1 = new cdb.geo.CartoDBLayer();
        var layer2 = new cdb.geo.CartoDBLayer();

        layers.add(tileLayer);
        layers.add(layer1);
        layers.add(layer2);

        layers.moveLayer(layer1, { to: 2 });

        setTimeout(function() {
          expect(Backbone.sync).toHaveBeenCalled();
          done();
        }, 100);
      })

      it('should throw an exception if saving layers fails', function() {
        var layers = new cdb.admin.Layers();
        var tileLayer = new cdb.geo.TileLayer();
        var layer1 = new cdb.geo.CartoDBLayer();
        var layer2 = new cdb.geo.CartoDBLayer();

        spyOn(layers, 'saveLayers');

        layers.add(tileLayer);
        layers.add(layer1);
        layers.add(layer2);

        layers.moveLayer(layer1, { to: 2 });

        expect(layers.saveLayers.calls.count()).toEqual(1);

        expect(function(){
          layers.saveLayers.calls.first().args[0].error();
        }).toThrow('Error saving layers after moving them');
      })
    })
  });

  describe('CartoDBLayer', function() {
    var layer;

    beforeEach(function() {
      layer  = new cdb.admin.CartoDBLayer();
      layer.set('tile_style_custom', true);
      //layer.tooltip.addField('test1', 'test2');
    });

    afterEach(function() {
      delete localStorage['test_storage_'+layer.get('table_name')]
    })

    it("should set order on parse", function() {
      var a = layer.parse({
        id: 1,
        order: 1001,
        options: {}
      });
      expect(a.order).toEqual(1001);
      expect(a.id).toEqual(1);
    });

    it("should contain a default wizard type", function() {
      layer.sync = function() {}
      layer.table.set('geometry_types', ['st_point']);
      expect(layer.wizard_properties.get('type')).toEqual('polygon');
    })

    it("should not save when the layer is new", function() {
      layer.set('interactivity', 'test')
      spyOn(layer, 'save')
      layer.table.trigger('change:schema');
      expect(layer.save).not.toHaveBeenCalled();

      layer.set('tile_style', 'testttting')
      expect(layer.save).not.toHaveBeenCalled();
    });

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

    it("should not save more than MAX_HISTORY_TILE_STYLE", function() {
      for(var i = 0; i < layer.MAX_HISTORY_TILE_STYLE + 1; ++i) {
        layer.addToHistory('tile_style', 'test' + i);
      }
      expect(layer.get('tile_style_history').length).toEqual(layer.MAX_HISTORY_TILE_STYLE);

    });

    it("should change state", function() {
      var sqlView = new cdb.admin.SQLViewData();
      layer.sync = function() { var a = $.Deferred(); a.abort = function(){}; return a; }
      layer.table.isInSQLView = function() { return true; }
      layer.bindSQLView(sqlView);
      expect(layer.getCurrentState()).toEqual('success');
      sqlView.trigger('error');
      expect(layer.getCurrentState()).toEqual('error');
      sqlView.trigger('reset');
      expect(layer.getCurrentState()).toEqual('success');
    })

    it("should bind to sqlView", function() {
      var sqlView = new cdb.admin.SQLViewData();
      layer.table.isInSQLView = function() { return true; }
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
      sqlView.options.set('sql', 'testsql');
      sqlView.trigger('reset');
      expect(layer.save.calls.mostRecent().args[0]).toEqual({query: 'testsql', sql_source: undefined})
      sqlView.add({ cartodb_id: 1, test: 2})
      sqlView.trigger('reset');
      //expect(layer.save).toHaveBeenCalledWith({query: 'testsql' });
      expect(layer.save.calls.mostRecent().args[0]).toEqual({query: 'testsql', sql_source: undefined })
    })

    it("should disable interaction when the query has no cartodb_id", function() {
      spyOn(layer, 'save');
      layer.set({ interactivity: 'cartodb_id', id: 'test-id' });
      layer.table.set({
        schema: [
          ['the_geom_webmercator', 'geom'],
          ['test1', 'number'],
          ['test2', 'number']
        ]
      });
      expect(layer.save).toHaveBeenCalledWith({ interactivity: null });
      layer.set({ interactivity: null });
      layer.save.calls.reset();
      layer.table.set({
        schema: [
          ['cartodb_id', 'number'],
          ['the_geom_webmercator', 'geom']
        ]
      });
      expect(layer.save).toHaveBeenCalledWith({interactivity: 'cartodb_id'});
    });

    it("should include tooltip fields in interaction", function() {
      spyOn(layer, 'save');
      layer.table.set({
        schema: [
          ['cartodb_id', 'number'],
          ['the_geom_webmercator', 'geom'],
          ['test1', 'number'],
          ['test2', 'number']
        ]
      });
      layer.set({ interactivity: 'cartodb_id', id: 'test-id' });
      layer.tooltip.addField('test1').addField('test2');
      layer.table.set({
        schema: [
          ['the_geom_webmercator', 'geom'],
          ['test1', 'number'],
          ['test2', 'number']
        ]
      });
      expect(layer.save).toHaveBeenCalledWith({ interactivity: 'test1,test2'});

      layer.set({ interactivity: null });
      layer.save.calls.reset();
      layer.table.set({
        schema: [
          ['cartodb_id', 'number'],
          ['the_geom_webmercator', 'geom']
        ]
      });
      expect(layer.save).toHaveBeenCalledWith({interactivity: 'cartodb_id'});
      layer.table.set({
        schema: [
          ['cartodb_id', 'number'],
          ['the_geom_webmercator', 'geom'],
          ['test1', 'number'],
          ['test2', 'number'],
          ['test3', 'number']
        ]
      });
      layer.save.calls.reset();
      layer.tooltip.addField('test3');
      expect(layer.save).toHaveBeenCalledWith({ interactivity: 'cartodb_id,test3'});
    })

    it("should apply sql when it's binded to sqlView", function() {
      var sql;
      layer.set('query', sql = 'select * from table');
      var sqlView = new cdb.admin.SQLViewData();
      layer.bindSQLView(sqlView);
      expect(sqlView.getSQL()).toEqual(sql);
    });

    it("should define sqlView when binds it", function() {
      var sqlView = new cdb.admin.SQLViewData();
      layer.bindSQLView(sqlView);
      expect(layer.sqlView).toBeDefined();
    });

    it("should apply a sql to the sqlView if it was previously set in the layer", function() {
      var expected = false;
      layer.set("query", "SELECT * FROM table_test");
      layer.bind("applySQLView", function() {
        expected = true;
      });
      layer.bindSQLView(new cdb.admin.SQLViewData());
      expect(expected).toBeTruthy();
    });

    it("should apply a query", function() {
      var sqlView = new cdb.admin.SQLViewData();
      layer.bindSQLView(sqlView);
      spyOn(layer.sqlView, 'setSQL');
      spyOn(layer.sqlView, 'fetch');
      layer.applySQLView("SELECT * FROM test");
      expect(layer.query_history_position).toBe(0);
      expect(layer.get('query_history').length).toBe(1);
      expect(layer.sqlView.setSQL).toHaveBeenCalledWith("SELECT * FROM test", {silent:true, sql_source: null});
      expect(layer.sqlView.fetch).toHaveBeenCalled();

      layer.applySQLView("SELECT * FROM test where cartodb_id = 1234", { sql_source: 'rambo' });
      expect(layer.sqlView.setSQL).toHaveBeenCalledWith("SELECT * FROM test where cartodb_id = 1234", {silent:true, sql_source: 'rambo'});
    });

    it("should remove a query", function() {
      layer.sync = function() {}
      var sqlView = new cdb.admin.SQLViewData();
      layer.bindSQLView(sqlView);
      spyOn(layer, 'resetQuery');
      spyOn(layer.sqlView, 'fetch');
      layer.applySQLView("SELECT * FROM test WHERE cartodb_id > 10");
      layer.clearSQLView();

      expect(layer.get('query_history').length).toBe(2);
      expect(layer.table.isInSQLView()).toBeFalsy();
      expect(layer.resetQuery).toHaveBeenCalled();
    });

    it("when style is updated the forms should not be updated", function() {
      // generate some carto to test
      layer.sync = function() {}
      layer.table.set('geometry_types', ['st_polygon']);
      var gen = new cdb.admin.CartoStyles({ table: layer.table });
      gen.attr('polygon-fill', '#FFEE00');
      var custom_style = gen.get('style') + "\n #table::wadus { }";
      layer.sync = function() {}
      layer.wizard_properties.active('polygon');
      layer.set({
        tile_style: custom_style,
        tile_style_custom: true
      });
      expect(layer.wizard_properties.get('polygon-fill')).not.toEqual('#ffee00');
    });

    it("should use table information if it's included", function() {
      layer  = new cdb.admin.CartoDBLayer({
        table: { id: 'test', testing: 'test' }
      });
      expect(layer.table.get('testing')).toEqual('test');
    });

    it("should disable interactivity on torque, cluster, density", function() {
      //spyOn(layer, 'save');
      layer.sync = function() {};
      layer.table.set({
        'geometry_types': ['st_point'],
        'schema': [
          ['cartodb_id', 'number']
        ]
      });
      layer.wizard_properties.active('cluster');
      expect(layer.get('interactivity')).toEqual(null);
      layer.wizard_properties.active('polygon');
      expect(layer.get('interactivity')).toEqual('cartodb_id');
    })

    it(".moveToFront should move the layer above other data layers", function(done) {
      var baselayer = new cdb.admin.TileLayer();
      var layer2 = new cdb.admin.CartoDBLayer();
      var torqueLayer = new cdb.admin.TorqueLayer();
      var labelsLayer = new cdb.admin.TileLayer();
      var layers = new cdb.admin.Layers();

      // Stub save calls
      spyOn(layers, "saveLayers");

      layer.collection = layers;
      layers.add(baselayer); // Basemap
      layers.add(layer);

      layer.moveToFront();

      // There's only one layer so nothing really hapenned
      expect(layer.get('order')).toEqual(1);

      // Add some more layers above the existing one
      layers.add(layer2);
      layers.add(torqueLayer); // Torque layer
      layers.add(labelsLayer); // Layer with labels at the top

      // layer is above the baseLayer
      expect(layer.get('order')).toEqual(1);

      // Bind reset to check that is triggered
      var callback = jasmine.createSpy('callback');
      layers.bind('reset', callback);

      layer.moveToFront();

      setTimeout(function() {
        expect(callback.calls.count()).toEqual(1);
        expect(baselayer.get('order')).toEqual(0);
        expect(layer2.get('order')).toEqual(1);
        expect(torqueLayer.get('order')).toEqual(2);
        expect(layer.get('order')).toEqual(3);
        expect(labelsLayer.get('order')).toEqual(4);
        done();
      }, 0);

      expect(layers.saveLayers).toHaveBeenCalled();
    })
  });

});

describe("Infowindow", function() {
  it("should remove missing fields", function() {
    info = new cdb.geo.ui.InfowindowModel();
    info.addField('test').addField('test2');
    info.removeMissingFields(['test2', 'uhuh']);
    expect(info.containsField('test')).toEqual(false)
    expect(info.containsField('uhuh')).toEqual(false)
    expect(info.containsField('test2')).toEqual(true);
  });

  it("should add new fields and remove missing fields", function() {
    info = new cdb.geo.ui.InfowindowModel();
    info.addField('test').addField('test2');
    info.mergeFields(['test2', 'jamon']);
    expect(info.containsField('test')).toEqual(false)
    expect(info.containsField('uhuh')).toEqual(false)
    expect(info.containsField('test2')).toEqual(true);
    expect(info.containsField('jamon')).toEqual(true);
  });
});

describe('cdb.admin.TileLayer', function() {
  describe('.validateTemplateURL', function() {
    beforeEach(function() {
      var self = this;
      this.img = jasmine.createSpy('Image');
      spyOn(window, 'Image').and.callFake(function() {
        return self.img;
      });
      this.layer = new cdb.admin.TileLayer({
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
      });
      this.successSpy = jasmine.createSpy('success');
      this.errorSpy = jasmine.createSpy('error');
      this.layer.validateTemplateURL({
        success: this.successSpy,
        error: this.errorSpy
      });
    });

    it('should check a base tile', function() {
      expect(this.img.src).toMatch('http:\/\/[a-d]\.basemaps');
      expect(this.img.src).toContain('basemaps.cartocdn.com/light_nolabels/0/0/0.png');
    });

    describe('when succeeds to validate template URL', function() {
      beforeEach(function() {
        this.img.onload();
      });

      it('should call success callback', function() {
        expect(this.successSpy).toHaveBeenCalled();
        expect(this.errorSpy).not.toHaveBeenCalled();
      });
    });

    describe('when failed to validate template URL', function() {
      beforeEach(function() {
        this.img.onerror();
      });

      it('should call error callback', function() {
        expect(this.successSpy).not.toHaveBeenCalled();
        expect(this.errorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('.byCustomURL', function() {
    beforeEach(function() {
      this.layer = cdb.admin.TileLayer.byCustomURL('http://{S}.basemaps.cartocdn.com/light_nolabels/{Z}/{X}/{Y}.png?key=Abc123D');
    });

    it('should return a new tilelayer', function() {
      expect(this.layer instanceof cdb.admin.TileLayer).toBeTruthy();
    });

    it('should have the URL set as template with vars in small caps', function() {
      expect(this.layer.get('urlTemplate')).toEqual('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png?key=Abc123D');
    });

    it('should have a set of default values', function() {
      expect(this.layer.get('maxZoom')).toEqual(21);
      expect(this.layer.get('minZoom')).toEqual(0);
      expect(this.layer.get('name')).toEqual('');
      expect(this.layer.get('className')).toEqual('httpsbasemapscartocdncomlight_nolabelszxypngkeyabc123d');
    });

    it('should throw error when given an invalid URL', function() {
      expect(function() {
        cdb.admin.TileLayer.byCustomURL('bampadam!@#');
      }).toThrowError(TypeError);
    });
  });
});



describe('cdb.admin.Slide', function() {

  var map, slide, vis;
  beforeEach(function() {
    vis = new cdb.admin.Visualization({
      id: 'vis_id',
      map_id:           'map_id',
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table",
    });
    map = vis.map;
    map.layers.add(new cdb.admin.CartoDBLayer({ id: 'layer_0' }));
    map.layers.add(new cdb.admin.CartoDBLayer({ id: 'layer_1' }));
    map.layers.add(new cdb.geo.TileLayer({ id: 'baselayer_0' }));
    map.layers.at(0).table.set('geometry_types', ['st_point']);
    map.layers.at(1).table.set('geometry_types', ['st_point']);
    vis.overlays.url = '/vis_overlays';
    slide = new cdb.admin.Slide({ visualization_id : 'vis_id' });
    slide.visualization = new cdb.admin.Visualization();
    spyOn(jQuery, 'ajax').and.callThrough();
  });

  it('should fetch visualization data on activation', function() {
    slide.visualization = null;
    slide.setMaster(vis);
    slide.unload();
    slide.set('active', 'true');
    expect(jQuery.ajax).toHaveBeenCalled();
    expect(jQuery.ajax.calls.count()).toEqual(2);
  });

  it('should not fetch visualization data on activation if its loaded', function() {
    slide.setMaster(vis);
    slide.set('active', 'true');
    expect(jQuery.ajax).not.toHaveBeenCalled();
  });

  it("should unload", function() {
    function callbacksAttached(o) {
      var callbacks = o._callbacks;
      var c = [];
      for(var i in callbacks) {
        var node = callbacks[i];
        var end = node.tail;
        while ((node = node.next) !== end) {
          if (node.context && node.context.cid === slide.cid) {
            c.push(node);
          }
        }
      }
      return c;
    }

    slide.setMaster(vis);
    slide.unload();
    expect(slide.visualization).toEqual(null);
    cdb._debugCallbacks(slide)
    expect(_.size(slide._callbacks)).toEqual(1);
    expect(callbacksAttached(vis.map).length).toEqual(0);
    expect(callbacksAttached(vis.map.layers).length).toEqual(0);
    expect(callbacksAttached(vis.map.layers.at(0)).length).toEqual(0);
    expect(callbacksAttached(vis.map.layers.at(1)).length).toEqual(0);
    expect(callbacksAttached(vis.overlays).length).toEqual(0);
  });

  describe('cdb.admin.Slide.map', function() {

    it("should save map state on change", function() {
      slide.setMaster(vis);
      var center = [10, 20];
      map.set('center', center);
      var slide_map = slide.visualization.map;
      expect(slide_map.get('center')).not.toEqual(center);
      slide.set('active', true);
      center = [10, 80];
      map.set('center', center);
      map.set('zoom', 30);
      expect(slide_map.get('center')).toEqual(center);
      expect(slide_map.get('zoom')).toEqual(30);
    });

    it("should change map state on change", function() {
      slide.setMaster(vis);
      var center = [20, 30];
      slide.visualization.map.set({ 'center': center });
      slide.set('active', true);
      expect(map.get('center')).toEqual(center);
    });

  });

  describe("cdb.admin.Slide.layers", function() {

    it("shoudl create layer to track vis changes", function() {
      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.size()).toEqual(1);
      expect(slide.visualization.map.layers.at(0).get('parent_id')).toEqual(lyr.get('id'));
      expect(slide.visualization.map.layers.at(0).get('tile_style')).toEqual(lyr.get('tile_style'));
      lyr.set('tile_style', 'test2');
      expect(slide.visualization.map.layers.at(0).get('tile_style')).toEqual('test2');
    });

    it("should track layer removal", function() {
      var slide2 = new cdb.admin.Slide({ visualization_id : 'vis_id' });
      slide2.visualization = new cdb.admin.Visualization();
      slide2.set('active', false);
      slide2.setMaster(vis);

      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test2');

      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.size()).toEqual(1);
      lyr.destroy();
      expect(slide.visualization.map.layers.size()).toEqual(0);
    });

    it("should track layer add while active", function() {
      slide.setMaster(vis);
      var lyr = map.layers.at(0);
      slide.set('active', true);
      expect(slide.visualization.map.layers.size()).toEqual(0);
      map.layers.add(new cdb.admin.TileLayer({ urlTemplate: 'test' }));
      expect(slide.visualization.map.layers.size()).toEqual(1);
    });

    it("should untrack layer on remove", function() {
      slide.setMaster(vis);
      var lyr = map.layers.at(0);
      slide.set('active', true);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.size()).toEqual(1);
      map.layers.remove(lyr);
      expect(slide.visualization.map.layers.size()).toEqual(0);
    });

    it("should track on layer reset", function() {
      slide.setMaster(vis);
      var lyr = map.layers.at(0);
      slide.set('active', true);
      slide.visualization.map.layers.reset([{
        kind: 'carto',
        id: 'test',
        parent_id: lyr.id
      }]);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.at(0).get('tile_style')).toEqual('test');
    });

    it("should track basemap changes", function() {
      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = new cdb.admin.TileLayer({ urlTemplate: 'test' });
      map.setBaseLayer(lyr);
      expect(slide.visualization.map.layers.size()).toEqual(1);
      expect(slide.visualization.map.layers.at(0).get('urlTemplate')).toEqual('test');
      lyr.set('urlTemplate', 'test2');
      expect(slide.visualization.map.layers.at(0).get('urlTemplate')).toEqual('test2');


    });


    it("should track layers state", function() {
      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test');
      var slide_lyr = slide.visualization.map.layers.at(0);
      expect(slide_lyr.collection).toEqual(slide.visualization.map.layers);
      expect(slide_lyr.get('tile_style')).toEqual('test');
      slide.set('active', false);
      lyr.set('tile_style', 'test2');
      slide.set('active', true);
      expect(slide_lyr.get('tile_style')).toEqual('test');
      lyr.wizard_properties.active('density');
      expect(slide_lyr.wizard_properties.get('type')).toEqual('density');
      slide.set('active', false);
      lyr.wizard_properties.active('polygon');
      slide.set('active', true);
      expect(lyr.wizard_properties.get('type')).toEqual('density');
    });

    it("should track wizard props", function(done) {
      map.layers.clone(slide.visualization.map.layers);
      slide.setMaster(vis);
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
        expect(lyr.get('tile_style')).toEqual('test');
        done();
      }, 1000);
    });

    it("should track visibility", function() {
      map.layers.clone(slide.visualization.map.layers);
      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('visible', false);
      slide.set('active', false);
      lyr.set('visible', true);
      slide.set('active', true);
      expect(lyr.get('visible')).toEqual(false);
    });

  });

  describe("cdb.admin.Slide.overlays", function() {
    it("should track overlays changes", function() {
      slide.setMaster(vis);
      slide.set('active', true);
      vis.overlays.add([
        new cdb.admin.models.Overlay({ id: 'overlay_1', type: 'zoom'}),
        new cdb.admin.models.Overlay({ id: 'overlay_2', type: 'fullscreen'}),
      ]);
      var overlay = vis.overlays.at(0);
      expect(slide.visualization.overlays.size()).toEqual(0);
      overlay.set('display', false);
      expect(slide.visualization.overlays.size()).toEqual(1);
      expect(slide.visualization.overlays.at(0).get('display')).toEqual(false);
    });

    it("should track overlay removal", function() {
      slide.setMaster(vis);
      slide.set('active', true);
      var lyr = map.layers.at(0);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.size()).toEqual(1);
      lyr.destroy();
      expect(slide.visualization.map.layers.size()).toEqual(0);
    });

    it("should track on overlay reset", function() {
      slide.setMaster(vis);
      var lyr = map.layers.at(0);
      slide.set('active', true);
      slide.visualization.map.layers.reset([{
        kind: 'carto',
        id: 'test',
        parent_id: lyr.id
      }]);
      lyr.set('tile_style', 'test');
      expect(slide.visualization.map.layers.at(0).get('tile_style')).toEqual('test');

    })

    it("should place slide overlays in visualization", function() {
      slide.setMaster(vis);
      slide.visualization.overlays.add([
        new cdb.admin.models.Overlay({ id: 'overlay_1', type: 'zoom', parent_id: 'test_parent_id'}),
        new cdb.admin.models.Overlay({ id: 'overlay_2', type: 'fullscreen'}),
      ]);
      expect(vis.overlays.size()).toEqual(0)
      slide.set('active', true);
      expect(vis.overlays.size()).toEqual(2)
      expect(vis.overlays.at(0).get('parent_id')).toEqual(undefined);
    });


  });

  it("should remove visualization on remove", function() {
    fail();
  });

});

describe('cdb.admin.Slides', function() {

  var slides, vis;
  beforeEach(function() {
    vis = new cdb.admin.Visualization({ id: 'master_vis' });
    slides = new cdb.admin.Slides(null, {
      visualization: vis
    });
  });

  it("should create slide", function(done) {
    vis.map.layers.reset([
      new cdb.admin.TileLayer({ id: 'parentlayer' })
    ]);
    vis.createChild = function(a, opts) {
      var vis_copy = new cdb.admin.Visualization({ id: 'test_vis_id'});
      setTimeout(function() { 
        opts.success(vis_copy); 
        vis_copy.map.layers.reset([
          new cdb.admin.TileLayer({ id: 'test_layer_id' })
        ]);
      }, 10);
      return vis_copy;
    };
    var slide;
    slides.create(function(s) {
      slide = s;
    });

    setTimeout(function() {
      expect(slide.visualization.id).toEqual('test_vis_id');
      expect(slide.get('visualization_id')).toEqual('test_vis_id');
      expect(slide.visualization.map.layers.at(0).get('parent_id')).toEqual('parentlayer');
      done();
    }, 1000);

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

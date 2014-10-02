

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
    slide = new cdb.admin.Slide({ id: 'vis_id' });
    slide.visualization = new cdb.admin.Visualization({ id: 'test' });
    spyOn(jQuery, 'ajax').and.callThrough();
  });

  it('should set vis id on activation', function() {
    slide.setMaster(vis);
    slide.set('active', true);
    expect(vis.get('id')).toEqual(slide.visualization.id);
  });

  it('should fetch map data on activation', function() {
    slide.visualization = null;
    slide.setMaster(vis);
    slide.unload();
    slide.set('active', 'true');
    expect(jQuery.ajax).toHaveBeenCalled();
    // 1 map
    expect(jQuery.ajax.calls.count()).toEqual(1);
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
    expect(callbacksAttached(slide).length).toEqual(0);
  });

  describe('cdb.admin.Slide.map', function() {

    it("should save map state on change", function() {
      slide.visualization = null;
      slide.setMaster(vis);
      var center = [10, 20];
      map.set('center', center);
      var slide_map = slide.visualization.map;
      expect(slide_map.get('center')).not.toEqual(center);
      slide.set('active', true);
      map.set('center', center);
      expect(slide_map.get('center')).toEqual(center);
    });

  });

  it("should remove visualization on remove", function() {
    slide.setMaster(vis);
    var s = sinon.spy();
    //spyOn(slide.visualization, 'destroy');
    slide.bind('destroy', s);
    slide.destroy();
    //expect(slide.visualization.destroy).toHaveBeenCalled();
    expect(s.called).toEqual(true);
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
    vis.copy = function(a, opts) {
      var vis_copy = new cdb.admin.Visualization({ id: 'test_vis_id'});
      setTimeout(function() { 
        opts.success(vis_copy); 
        vis_copy.map.layers.reset([
          new cdb.admin.TileLayer({ id: 'test_layer_id', parent_id: 'parentlayer' })
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

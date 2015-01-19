

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

  it('should not fetch map data on activation', function() {
    slide.visualization = null;
    slide.setMaster(vis);
    slide.unload();
    slide.set('active', 'true');
    expect(jQuery.ajax.calls.count()).toEqual(0);
  });

  it("should remove visualization on remove", function() {
    slide.setMaster(vis);
    var s = sinon.spy();
    spyOn(slide.visualization, 'destroy');
    slide.bind('destroy', s);
    slide.destroy();
    expect(slide.visualization.destroy).toHaveBeenCalled();
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
    var c = 0;
    vis.copy = function(a, opts) {
      var vis_copy = new cdb.admin.Visualization({ id: 'test_vis_id' + (++c)});
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
      expect(slides.at(0).visualization.id).toEqual('test_vis_id1');
      expect(slide.visualization.id).toEqual('test_vis_id2');
      expect(slide.visualization.map.layers.at(0).get('parent_id')).toEqual('parentlayer');
      // this is not wrong, it's expected to create 2 slides when there 
      // are no slides
      expect(slides.length).toEqual(2);
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

  describe('setNext', function() {
    beforeEach(function() {
      slides.reset([
       new cdb.admin.Slide({ id: 'id_0' }),
       new cdb.admin.Slide({ id: 'id_1' }),
       new cdb.admin.Slide({ id: 'id_2' })
      ])
    });

    it("should reorder layers", function() {
      slides.at(0).setNext('id_1');
      expect(slides.at(0).id).toEqual('id_0');
      expect(slides.at(1).id).toEqual('id_1');
      expect(slides.at(2).id).toEqual('id_2');
    })

    it("should reorder layers 2", function() {
      slides.at(2).setNext('id_1');
      expect(slides.at(0).id).toEqual('id_0');
      expect(slides.at(1).id).toEqual('id_2');
      expect(slides.at(2).id).toEqual('id_1');
    })

    it("should reorder moving to the end", function() {
      slides.at(0).setNext(null);
      expect(slides.at(0).id).toEqual('id_1');
      expect(slides.at(1).id).toEqual('id_2');
      expect(slides.at(2).id).toEqual('id_0');
    })

    it("should reorder moving to the beginning", function() {
      slides.at(2).setNext('id_0');
      expect(slides.at(0).id).toEqual('id_2');
      expect(slides.at(1).id).toEqual('id_0');
      expect(slides.at(2).id).toEqual('id_1');
    })

  });
});

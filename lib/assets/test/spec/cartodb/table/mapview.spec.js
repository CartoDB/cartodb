
describe("mapview", function() {

  var view;
  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var map = new cdb.admin.Map();
    map.layers.add(new cdb.geo.MapLayer());
    map.layers.add(new cdb.geo.MapLayer());
    var element = $('<div class="pato"></div>');
    element.appendTo($('body'))
    view = new cdb.admin.MapTab({
      model: map,
      table: table,
      infowindow: infowindow,
      menu: new cdb.admin.RightMenu({}),
      el: element
    });
    window.aaa= view;
    // view.baseLayerChooser = {
    //   render: function() {
    //     return {
    //       "el": "dummy"
    //     }
    //   }
    // }
    // view._bindDataLayer(map.get('dataLayer').cid);

  });

  afterEach(function() {
    localStorage.clear();
    view.$el.html('').remove();
    $('.dropdown').remove();
  })

  it("should render", function() {
    view.render();
    expect(view.$('#map').length).toEqual(1);
    expect(view.$('.base_maps').length).toEqual(1);
    expect(view.$('.share').length).toEqual(1);
  });


  it("should trigger the georef warning when there's no geom in the table", function() {
    localStorage.clear();
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  })


  it("should trigger the georef warning when there's no data in the table", function() {
    view.options.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  })

  it("should NOT trigger the georef warning when there the_geom and data in the table", function() {
    view.options.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.options.table._data.reset([{'the_geom':'{"type":"Point","coordinates":["1","1"]}'}])
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  })

  it("should trigger the georef warning only once when there's no geom in the table", function() {
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  })

  it("should trigger the georef only once warning when there's no data in the table", function() {
    view.options.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  })

  it("should trigger the georef again when formerly there were any data and now there are data but not georeferenced", function() {

    view.options.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name','string']]);
    view.bindGeoRefCheck();
    view.render();
    view.options.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.options.table._data.reset([{'name':'tralará'}])
    view.options.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  })


});

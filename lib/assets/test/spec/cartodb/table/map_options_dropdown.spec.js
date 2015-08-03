describe("map_options_dropdown", function() {

  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var vis = TestUtil.createVis("jam");
    this.user = TestUtil.createUser('jamon');
    master_vis = TestUtil.createVis("jam");
    var map = new cdb.admin.Map();
    var layer = new cdb.admin.CartoDBLayer({
      table_name: 'test',
      tile_style: 'test',
      user_name: 'test'
    });
    map.layers.add(layer);
    map.layers.add(new cdb.admin.CartoDBLayer({
      table_name: 'test2',
      tile_style: 'style',
      user_name: 'test'
    }));
    var element = $('<div><div class="cartodb-map"></div></div>');
    element.appendTo($('body'));

    view = new cdb.admin.MapTab({
      user: this.user,
      model: map,
      vis: vis,
      master_vis: master_vis,
      menu: new cdb.admin.RightMenu({}),
      geocoder: new cdb.admin.Geocoding('', table),
      el: element,
      baseLayers: new cdb.admin.Layers([ new cdb.admin.TileLayer({ urlTemplate: 'rabos'}) ])
    });

    this.header = new cdb.core.Model({
      order: 1,
      shareable: false,
      description: "Description",
      title: "Hello!",
      type: "header",
      url: null,
      extra: {
        description: "Description",
        title: "Hello!",
        show_title: true,
        show_description: true
      }
    });

    this.overlays = new Backbone.Collection([
      this.header,
      new cdb.core.Model({
        device: "screen",
        type: "text",
        style: {
          "z-index": 9
        }
      }),
      new cdb.core.Model({
        type: "text",
        device: "screen",
        style: {
          "z-index": 2
        }
      })
    ]);

    var canvas  = new cdb.core.Model({ mode: "desktop" });

    this.view = new cdb.admin.MapOptionsDropdown({
      target:              $('.show-table-options'),
      template_base:       "table/views/map_options_dropdown",
      table:               table,
      model:               map,
      mapview:             this.mapView,
      collection:          this.overlays,
      user:                this.user,
      vis:                 vis,
      canvas:              canvas,
      position:            "position",
      tick:                "left",
      vertical_position:   "up",
      horizontal_position: "left",
      horizontal_offset:   "-3px"
    });
  });

  afterEach(function() {
    //if (view.options.geocoder.dlg) view.options.geocoder.dlg.hide();
    //if (view.noGeoRefDialog) view.noGeoRefDialog.clean();
    //if (view.pecanDialog) view.pecanDialog.clean();
    //localStorage.clear();
    //view.$el.html('').remove();
    //$('.dropdown').remove();
  });

  it("should render the dropdown", function() {
    this.view.render();
    expect(this.view.$('.switches li').length).toEqual(9);
  });

  it("should change disabled the description option when show_description is false ", function() {
    this.view.render();
    expect(this.view.$('.switches li.description').hasClass("active")).toBe(true);
    var extra = this.header.get("extra");
    extra.show_description = false;
    this.header.set({ extra: extra, description: "" });
    expect(this.view.$('.switches li.description').hasClass("active")).toBe(false);
  });
});

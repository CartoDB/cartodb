describe("Base map chooser", function() {

  var model, view, map, baseLayerChooser, baseLayers, dropdownBasemap;

  beforeEach(function() {

    model = new cdb.admin.TileLayer({
      urlTemplate: 'http://test.com'
    });

    map = new cdb.admin.Map({
      provider: 'leaflet'
    });

    // add base map
    map.layers.add(new cdb.admin.TileLayer());

    view = new cdb.admin.BaseMapView({
      el: $('<div>'),
      model: model,
      map: map
    });

    baseLayers = new cdb.admin.Layers();
    baseLayers.add(model);

    baseLayerChooser = new cdb.admin.BaseMapChooser({
      model: map,
      mapview: view,
      baseLayers: baseLayers
    });

    dropdownBasemap = new cdb.admin.DropdownBasemap({
      template_base: "common/views/dropdown_basemap",
      model: map,
      mapview: view,
      baseLayers: baseLayers
    });

  });

  it("should show a list of layers", function() {
    dropdownBasemap.render();

    expect(dropdownBasemap.$el.find("li").length > 0 ).toEqual(true);
  });

  it("should contain a option to change the color background", function() {
    dropdownBasemap.render();
    expect(dropdownBasemap.$el.find("li.map_background").length).toEqual(1);
  });

  it("should contain a option to add a custom basemap", function() {
    dropdownBasemap.render();
    expect(dropdownBasemap.$el.find("li.add_basemap").length).toEqual(1);
  });

  it("should add a special list for the special options", function() {
    dropdownBasemap.render();
    expect(dropdownBasemap.$el.find("ul.special").length).toEqual(1);
  });

  it("should add an element to store the custom basemaps", function() {
    dropdownBasemap.render();
    expect(dropdownBasemap.$el.find("div.custom").length).toEqual(1);
  });

  it("should append a button to add new basemaps", function() {
    dropdownBasemap.render();
    expect(dropdownBasemap.$el.find(".add").length).toEqual(1);
  });

  it("should open a dialog when the user press the add link", function() {
    dropdownBasemap.render();
    dropdownBasemap.$el.find(".add").trigger("click");

    expect($("body").find(".dialog.basemap_chooser_dialog").length).toEqual(1);
  });

  it("should change base layer when click", function() {
    spyOn(map, 'setBaseLayer');

    baseLayerChooser.render();
    baseLayerChooser.$el.find("li:eq(0)").trigger('click');

    expect(map.setBaseLayer).toHaveBeenCalled();
    expect(baseLayerChooser.$el.find("li").size()).toEqual(6);
  });

  it("should append a new button when a new layer is added", function() {

    baseLayerChooser.render();

    var layer = new cdb.admin.TileLayer({
      urlTemplate: 'http://test.com',
      attribution:  null,
      maxZoom:      21,
      minZoom:      0,
      name:         "name"
    });

    layer.save();
    expect(baseLayerChooser.$el.find("li").size()).toEqual(7);

  });

});

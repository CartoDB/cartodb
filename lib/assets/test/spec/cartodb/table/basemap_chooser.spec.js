describe("Base map chooser", function() {

  var model, view, map, baseLayerChooser, baseLayers;
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
  });

  it("should change base layer when click", function() {
    spyOn(map, 'setBaseLayer');
    baseLayerChooser.render();
    baseLayerChooser.$el.find("li:eq(0)").trigger('click');
    expect(map.setBaseLayer).toHaveBeenCalled();
    expect(baseLayerChooser.$el.find("li").size()).toEqual(6);
  });

});

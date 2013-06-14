describe('Interaction funcionality', function() {
  var div, map, cdb_layer;

  beforeEach(function() {

    div = document.createElement('div');
    div.setAttribute("id","map");
    div.style.height = "100px";
    div.style.width = "100px";

    map = new google.maps.Map(div, {
      center: new google.maps.LatLng(51.505, -0.09),
      disableDefaultUI: false,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
    });

    cdb_layer = new cdb.geo.CartoDBLayerGMaps({
      map: map,
      user_name:"examples",
      table_name: 'country_colors',
      tile_style: 'test',
      opacity:0.8,
      interactivity: "cartodb_id",
      debug: true,
      interaction: true
    });


    map.overlayMapTypes.setAt(0, cdb_layer);
  });


  it('If there is no interaction defined, shouldn\'t work and failed', function() {
    // Fake a mouseover
    $(div).trigger('mouseover');
    expect(cdb_layer._manageOnEvents).toThrow();

    // Fake a mouseout
    $(div).trigger('mouseout');
    expect(cdb_layer._manageOffEvents).toThrow();

    // Fake a click
    $(div).trigger('click');
    expect(cdb_layer._manageOffEvents).toThrow();
  });

});

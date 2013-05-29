describe('Hide funcionality', function() {
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
      tile_style: 'test',
      table_name: 'earthquakes',
      query: "SELECT * FROM {{table_name}}",
      tile_style: "#{{table_name}}{marker-fill:#E25B5B}",
      opacity:0.8,
      interactivity: "cartodb_id, magnitude",
      featureOver: function(ev,latlng,pos,data) {},
      featureOut: function() {},
      featureClick: function(ev,latlng,pos,data) {},
      debug: true
    });

    map.overlayMapTypes.setAt(0, cdb_layer);

  });


  it('if hides layers should work', function() {

    waits(500);

    runs(function () {
      cdb_layer.hide();
    });

    waits(500);

    runs(function() {
      var $tile = $(div).find("img[gtilekey]").first()
        , opacity = cdb_layer.options.opacity
        , before_opacity = cdb_layer.options.previous_opacity;

      expect(cdb_layer.visible).toBeFalsy();
      expect($tile.css("opacity")).toEqual('0');
      expect(opacity).toEqual(0);
      expect(before_opacity).not.toEqual(0);
    });
  });

  it('If sets opacity to 0, layer should be visible', function() {
    waits(500);

    runs(function () {
      cdb_layer.setOpacity(0);
      expect(cdb_layer.options.visible).toBeTruthy();
    });
  });
});

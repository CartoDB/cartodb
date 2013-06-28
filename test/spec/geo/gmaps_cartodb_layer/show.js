describe('Show funcionality', function() {
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


  it('If layer is visible, show shouldn\'t do anything', function() {

    waits(500);

    runs(function () {
      expect(cdb_layer.show).toThrow();
      var opacity = cdb_layer.options.opacity;
      expect(cdb_layer.options.visible).toBeTruthy();
    });
  });

  it('Shows layer after hide it', function() {

    waits(500);

    runs(function () {
      cdb_layer.hide();
      cdb_layer.show();
      expect(cdb_layer.options.visible).toBeTruthy();
    });
  });

  it('If hides layer and set an opacity greater than 0, layer shouln\'t be visible', function() {

    waits(500);

    runs(function () {
      cdb_layer.hide();
      cdb_layer.setOpacity(0.2);
      expect(cdb_layer.visible).toBeFalsy();
    });
  });
});

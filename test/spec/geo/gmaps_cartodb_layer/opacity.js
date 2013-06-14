describe('Opacity interaction', function() {
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
      opacity: 0.8,
      interactivity: "cartodb_id, magnitude",
      featureOver: function(ev,latlng,pos,data) {},
      featureOut: function() {},
      featureClick: function(ev,latlng,pos,data) {},
      debug: true
    });
    map.overlayMapTypes.setAt(0, cdb_layer);

  });

  xit('Layer opacity should be 0.8', function() {

    waits(500);

    runs(function () {
      var $layer = $(div).find("img[gtilekey]").first()
        , opacity = cdb_layer.options.opacity;

      expect(cdb_layer.options.visible).toBeTruthy();
      expect($layer.css("opacity")).toEqual('0.8');//opacity.toString());
    });
  });


  xit('Opacity shouldn\'t change if it is not visible', function() {
    
    waits(500);

    runs(function() {
      cdb_layer.hide();
      cdb_layer.setOpacity(0.3);
      map.overlayMapTypes.setAt(0, cdb_layer);
    });

    waits(500);

    runs(function () {
      var $layer = $(div).find("img[gtilekey]").first()
        , opacity = cdb_layer.options.opacity
        , before_opacity = cdb_layer.options.previous_opacity;

      expect(cdb_layer.options.visible).toBeFalsy();
      expect($layer.css("opacity")).toEqual('0.3');
      expect(before_opacity).toEqual(0.8);
    });
  });


  // it('Opacity should change if layer is visible', function() {
  //   cdb_layer.setOpacity(0.3);

  //   var $layer = $(div).find(".leaflet-layer")
  //     , opacity = cdb_layer.options.opacity;

  //   expect(cdb_layer.options.visible).toBeTruthy();
  //   expect($layer.css("opacity")).toEqual('0.3');
  // });


  // it('If sets opacity to 0, the layer is still visible', function() {
  //   cdb_layer.setOpacity(0);

  //   var $layer = $(div).find(".leaflet-layer")
  //     , opacity = cdb_layer.options.opacity;

  //   expect(cdb_layer.options.visible).toBeTruthy();
  //   expect($layer.css("opacity")).toEqual('0');
  // });
});

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


  it('If there is interaction defined, click should work', function() {

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });
      // update the layer
      map.overlayMapTypes.setAt(0, cdb_layer);
    });

    waits(3000);

    runs(function () {
      spyOn(cdb_layer, '_manageOnEvents');

      var e = new $.Event("click");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      cdb_layer.interaction.click(e,{x:100,y:100});
    });

    waits(3000);

    runs(function () {
      expect(cdb_layer._manageOnEvents).toHaveBeenCalled();
    });
  });


  it('If there is interaction defined, mouseover should work', function() {

    waits(500);

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });
      // update the layer
      map.overlayMapTypes.setAt(0, cdb_layer);
    });

    waits(500);

    runs(function () {
      spyOn(cdb_layer, '_manageOnEvents');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(1000);

    runs(function () {
      expect(cdb_layer._manageOnEvents).toHaveBeenCalled();
    });
  });


  it('If there is interaction defined, mouseout should work', function() {

    waits(500);

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });

      // Move map to a place without a feature
      map.setCenter(new google.maps.LatLng(51.17934297928927, -28.828125))
    });

    waits(500);

    runs(function () {
      spyOn(cdb_layer, '_manageOffEvents');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(500);

    runs(function () {
      expect(cdb_layer._manageOffEvents).toHaveBeenCalled();
    });
  });


  it('A click action should return data', function() {

    waits(500);

    runs(function () {

      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {
          expect(latlng).not.toBeNull()
          expect(latlng.lat).toBeDefined();
          expect(latlng.lng).toBeDefined();
          expect(ev).not.toBeNull();
          expect(pos).not.toBeNull();
          expect(data).not.toBeNull();
          expect(data.cartodb_id).toBeDefined();
        }
      });
    });

    waits(500);

    runs(function () {
      var e = new jQuery.Event("click");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      e.screenX = 10;
      e.screenY = 10;
      e.pos = {x:10, y:10};
      e.offsetY = 10;
      e.offsetX = 10;
      e.x = 10;
      e.y = 10;

      $(div).trigger(e);

      cdb_layer.interaction.click(e,{x:100,y:100});
    });
  });


  it('A museover action should return data', function() {
    waits(500);

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {
          expect(latlng).not.toBeNull()
          expect(latlng.lat).toBeDefined();
          expect(latlng.lng).toBeDefined();
          expect(ev).not.toBeNull();
          expect(pos).not.toBeNull();
          expect(data).not.toBeNull();
          expect(data.cartodb_id).toBeDefined();
        },
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });
    });

    waits(500);

    runs(function () {
      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      e.screenX = 10;
      e.screenY = 10;
      e.pos = {x:10, y:10};
      e.offsetY = 10;
      e.offsetX = 10;
      e.x = 10;
      e.y = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });
  });

  it('A setInteraction(false) should disable interactivity', function() {
    waits(500);

    runs(function () {
      cdb_layer.setInteraction(false);
    });

    waits(500);

    runs(function() {
      expect(cdb_layer.interaction).toEqual(null);
    });
  });

  it('A mouseout action should arrive', function() {
    waits(500);

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });

      // Move map to a place without a feature
      map.setCenter(new google.maps.LatLng(51.17934297928927, -28.828125))
    });

    waits(500);

    runs(function () {
      spyOn(cdb_layer.options, 'featureOut');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      e.screenX = 10;
      e.screenY = 10;
      e.pos = {x:10, y:10};
      e.offsetY = 10;
      e.offsetX = 10;
      e.x = 10;
      e.y = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(500);

    runs(function () {
      expect(cdb_layer.options.featureOut).toHaveBeenCalled();
    });
  });

});

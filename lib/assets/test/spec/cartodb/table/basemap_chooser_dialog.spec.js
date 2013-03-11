describe("Basemap adder dialog", function() {
  var basemap_dialog, table;

  beforeEach(function() {
    table = TestUtil.createTable('test');
    basemap_dialog = new cdb.admin.BaseMapAdder({
      model: this.model,
      baseLayers: {},
      ok: function(layer) {}
    });
  });

  it("should fix https url", function() {
    var url = cdb.admin.BaseMapAdder.prototype._fixHTTPS('http://test.com/1.json', { protocol: 'https:' });
    expect(url).toEqual('https://test.com/1.json');

    url = cdb.admin.BaseMapAdder.prototype._fixHTTPS('http://test.com/1.json', { protocol: 'http:' });
    expect(url).toEqual('http://test.com/1.json');
  });

  it("should use mapbox https url", function() {
    var url = cdb.admin.BaseMapAdder.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json',
      { protocol: 'https:' }
    );

    expect(url).toEqual('https://dnv9my2eseobd.cloudfront.net/v3/examples.map-4l7djmvo.json');

    url = cdb.admin.BaseMapAdder.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json',
      { protocol: 'http:' }
    );
    expect(url).toEqual(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json'
    )
  });

  it("should transform public mapbox urls to the correct ones", function() {
    var url = cdb.admin.BaseMapAdder.prototype.transformMapboxUrl.call(this, "http://tiles.mapbox.com/cartodb/map/map-02i0no2h")
    expect(url).toEqual('http://tiles.mapbox.com/v3/cartodb.map-02i0no2h/{z}/{x}/{y}.png')
  })

  it("should open the basemap chooser dialog", function() {
    basemap_dialog.render();
    expect(basemap_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Add your basemap');
    expect(basemap_dialog.$el.find("input").length).toEqual(1);
  });

  it("should show an error if the tilejson doesn't exist", function() {
    basemap_dialog.render();
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.$el.find("input").val("http://a.tiles.mapbox.com/v3/cartodb.map-uulyudas-jamon-error.jsonp");
    basemap_dialog._checkTileJson();
    expect(basemap_dialog._errorChooser).not.toHaveBeenCalled();
  });

  it("should show an error if the xyz tile doesn't exist", function() {
    basemap_dialog.render();
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.$el.find("input").val("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{Z}/{y}/{X}/error");
    basemap_dialog._checkTileJson();
    expect(basemap_dialog._errorChooser).not.toHaveBeenCalled();
  });

  it("should return a new layer when add a correct tilejson url", function() {
    runs(function() {
      basemap_dialog.render();
      spyOn(basemap_dialog, '_successChooser');
      basemap_dialog.$el.find("input").val("http://a.tiles.mapbox.com/v3/cartodb.map-uulyudas.jsonp");
      basemap_dialog._checkTileJson();
    });

    waits(500);
    runs(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
    })
  });

  it("should return a new layer when add a correct image xyz url", function() {
    runs(function() {
      basemap_dialog.render();
      spyOn(basemap_dialog, '_successChooser');
      basemap_dialog.$el.find("input").val("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}");
      basemap_dialog._checkTileJson();
    });
    waits(500);
    runs(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
    })
  });

  it("should return a new layer when add a correct image xyz url without https", function() {
    runs(function() {
      basemap_dialog.render();
      spyOn(basemap_dialog, '_successChooser');
      basemap_dialog.$el.find("input").val("http://c.tile.stamen.com/watercolor/{Z}/{X}/{Y}.jpg");
      basemap_dialog._checkTileJson();
    });
    waits(500);
    runs(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
    })
  });

});

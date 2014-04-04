describe("Basemap adder dialog", function() {
  var basemap_dialog, table, server, base_layers;

  beforeEach(function() {
    table = TestUtil.createTable('test');

    base_layers = new Backbone.Collection()
    base_layers.url = '/test';

    basemap_dialog = new cdb.admin.BaseMapAdder({
      model: this.model,
      baseLayers: base_layers,
      ok: function(layer) {}
    });
    server = sinon.fakeServer.create();

  });


  it("should open the basemap chooser dialog", function() {
    basemap_dialog.render();
    expect(basemap_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Add your basemap');
  });

  it("should render the tabs and the panes", function() {
    basemap_dialog.render();
    expect(basemap_dialog.$el.find(".basemap-tab").size()).toBe(3);
  });

  it("should activate mapbox pane by default and change pane", function() {
    basemap_dialog.render();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("mapbox");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.mapboxPane.$el.find("input").attr('placeholder')).toEqual('Insert your MapBox map URL or map id');
    basemap_dialog.$el.find(".zxy").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("xyz");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.find("input").attr('placeholder')).toEqual('Insert your XYZ URL template');
    basemap_dialog.$el.find(".wms").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("wms");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.wmsPane.$el.find("input").attr('placeholder')).toEqual('Insert your WMS base URL');
    basemap_dialog.$el.find(".mapbox").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("mapbox");
  });

  it("should have the ok button disabled when the input has no value, and enabled when it has", function() {
    //
  });

  it("should fix https url", function() {
    var url = cdb.admin.ZXYBasemapChooserPane.prototype._fixHTTPS('http://test.com/1.json', { protocol: 'https:' });
    expect(url).toEqual('https://test.com/1.json');

    url = cdb.admin.ZXYBasemapChooserPane.prototype._fixHTTPS('http://test.com/1.json', { protocol: 'http:' });
    expect(url).toEqual('http://test.com/1.json');
  });

  it("should fix mapbox https url", function() {
    var url = cdb.admin.MapboxBasemapChooserPane.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json',
      { protocol: 'https:' }
    );

    expect(url).toEqual('https://dnv9my2eseobd.cloudfront.net/v3/examples.map-4l7djmvo.json');

    url = cdb.admin.MapboxBasemapChooserPane.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json',
      { protocol: 'http:' }
    );
    expect(url).toEqual(
      'http://a.tiles.mapbox.com/v3/examples.map-4l7djmvo.json'
    )
  });

  it("should send mapbox url if user provides the mapbox edit url", function(done) {
    //spyOn(basemap_dialog, '_successChooser');
    var s = sinon.spy();
    basemap_dialog.options.ok = s

    basemap_dialog.render();
    var val = basemap_dialog.mapboxPane.$el.find("input").val("https://tiles.mapbox.com/cartodb/edit/map-eeoepub0#3/0.09/0.00");
    basemap_dialog.mapboxPane.checkTileJson(val.val());


    setTimeout(function() {
      expect(s.called).toEqual(true);
      var layer = s.lastCall.args[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v3/cartodb.map-eeoepub0/{z}/{x}/{y}.png");
      done();
    }, 1500);

  });

  it("should send mapbox url if user provides the embed url", function(done) {
    spyOn(basemap_dialog, '_successChooser');
    basemap_dialog.render();

    var val = basemap_dialog.mapboxPane.$("input").val("http://a.tiles.mapbox.com/v3/cartodb.map-eeoepub0/page.html");

    basemap_dialog.mapboxPane.checkTileJson(val.val());

    setTimeout(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
      var layer = basemap_dialog._successChooser.calls.argsFor(0)[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v3/cartodb.map-eeoepub0/{z}/{x}/{y}.png");
      done()
    }, 500);

  });

  it("should send mapbox url if user provides the mapbox xyz url", function(done) {
    spyOn(basemap_dialog, '_successChooser');
    basemap_dialog.render();

    var val = basemap_dialog.mapboxPane.$("input").val("http://d.tiles.mapbox.com/v3/cartodb.map-eeoepub0/{z}/{y}/{z}.png");

    basemap_dialog.mapboxPane.checkTileJson(val.val());
    setTimeout(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
      var layer = basemap_dialog._successChooser.calls.argsFor(0)[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v3/cartodb.map-eeoepub0/{z}/{x}/{y}.png");
      done();
    }, 500);
  });

  it("should show an error if the mapbox tile doesn't exist", function(done) {
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.render();

    var val = basemap_dialog.zxyPane.$el.find("input").val("http://a.tiles.mapbox.com/v3/tiles-tiles-tiles-tiles/{z}/{x}/{y}.png/error");

    basemap_dialog.zxyPane.checkTileJson(val.val());

    setTimeout(function() {
      expect(basemap_dialog._errorChooser).toHaveBeenCalled();
      done();
    }, 500);
  });

  xit("should show an error if the wms url template doesn't exist", function(done) {
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.render();

    var val = basemap_dialog.wmsPane.$el.find("input").val("http://google.com");

    basemap_dialog.wmsPane.checkTileJson(val.val());

    setTimeout(function() {
      expect(basemap_dialog._errorChooser).toHaveBeenCalled();
      done();
    }, 700);
  });

  it("should show an error if the xyz tile doesn't exist", function(done) {
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.render();

    var val = basemap_dialog.zxyPane.$el.find("input").val("http://{z}/{x}/{y}");

    basemap_dialog.zxyPane.checkTileJson(val.val());

    setTimeout(function() {
      expect(basemap_dialog._errorChooser).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should return a new layer when add a correct image xyz url", function() {
    spyOn(basemap_dialog, 'hide');
    basemap_dialog.render();

    var url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

    cdb.admin.TileLayer = cdb.admin.TileLayer.extend({ url: '/test' })

    basemap_dialog.zxyPane.$el.find("input").val(url);
    basemap_dialog.zxyPane._successChooser({ tiles: [url] });
    expect(basemap_dialog.options.baseLayers.size()).toBe(1);
    expect(basemap_dialog.hide).toHaveBeenCalled();
  });

  it("should return a new layer when add a correct image xyz url without https", function() {
    spyOn(basemap_dialog, 'hide');
    basemap_dialog.render();

    var url = "http://c.tile.stamen.com/watercolor/{Z}/{X}/{Y}.jpg";

    cdb.admin.TileLayer = cdb.admin.TileLayer.extend({ url: '/test' })

    basemap_dialog.zxyPane.$el.find("input").val(url);
    basemap_dialog.zxyPane._successChooser({ tiles: [url] });
    expect(basemap_dialog.options.baseLayers.size()).toBe(1);
    expect(basemap_dialog.hide).toHaveBeenCalled();
  });

});


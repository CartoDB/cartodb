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
    expect(basemap_dialog.$el.find(".basemap-tab").size()).toBe(4);
  });

  it("should activate mapbox pane by default and change pane", function() {
    basemap_dialog.render();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("xyz");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.nasaPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.mapboxPane.$el.find("input[name='url']").attr('placeholder')).toEqual('Insert your Mapbox map URL or map id');
    expect(basemap_dialog.mapboxPane.$el.find("input[name='access_token']").attr('placeholder')).toEqual('Insert your Mapbox access token');
    basemap_dialog.$el.find(".mapbox").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("mapbox");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.nasaPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.find("input").attr('placeholder')).toEqual('Insert your XYZ URL template');
    basemap_dialog.$el.find(".wms").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("wms");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('block');
    expect(basemap_dialog.nasaPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.find("input").attr('placeholder')).toEqual('Insert your WMS base URL');
    basemap_dialog.$el.find(".nasa").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("nasa");
    expect(basemap_dialog.mapboxPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.zxyPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.wmsPane.$el.css('display')).toBe('none');
    expect(basemap_dialog.nasaPane.$el.css('display')).toBe('block');
    basemap_dialog.$el.find(".mapbox").click();
    expect(basemap_dialog.basemap_panes.activeTab).toEqual("mapbox");
  });

  it("should have the ok button disabled when the input has no value, and enabled when it has", function() {
    //
  });

  it("should fix mapbox https url", function() {
    var url = cdb.admin.MapboxBasemapChooserPane.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json',
      { protocol: 'https:' }
    );

    expect(url).toEqual('https://dnv9my2eseobd.cloudfront.net/v4/examples.map-4l7djmvo.json');

    url = cdb.admin.MapboxBasemapChooserPane.prototype._fixHTTPS(
      'http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json',
      { protocol: 'http:' }
    );
    expect(url).toEqual(
      'http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json'
    )
  });

  it("should send mapbox url if user provides the mapbox edit url", function(done) {
    var s = sinon.spy();
    basemap_dialog.options.ok = s

    var user = "cartodb";
    var mapid = "map-eeoepub0";
    var mapboxid = user + "." + mapid;
    var access_token = "ACCESS_TOKEN";

    basemap_dialog.render();

    var $url = basemap_dialog.mapboxPane.$("input[name='url']").val("https://tiles.mapbox.com/" + user + "/edit/" + mapid + "#3/0.09/0.00");
    var $access_token = basemap_dialog.mapboxPane.$("input[name='access_token']").val(access_token);

    // for sure jasmine has a function for this
    var old_ajax = jQuery.ajax;
    var spy = spyOn(jQuery, 'ajax').and.callFake(function(params) {
      jQuery.ajax = old_ajax;
      params.success({ });
    });

    basemap_dialog.mapboxPane.checkTileJson($url.val(), $access_token.val());

    setTimeout(function() {
      expect(s.called).toEqual(true);
      var layer = s.lastCall.args[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v4/" + mapboxid + "/{z}/{x}/{y}.png?access_token=" + access_token);
      done();
    }, 1500);

  });

  it("should send mapbox url if user provides the embed url", function(done) {
    spyOn(basemap_dialog, '_successChooser');
    basemap_dialog.render();

    var mapboxid = "cartodb.map-eeoepub0";
    var access_token = "ACCESS_TOKEN";

    var $url = basemap_dialog.mapboxPane.$("input[name='url']").val("http://a.tiles.mapbox.com/v4/" + mapboxid + "/page.html");
    var $access_token = basemap_dialog.mapboxPane.$("input[name='access_token']").val(access_token);

    var old_ajax = jQuery.ajax;
    var spy = spyOn(jQuery, 'ajax').and.callFake(function(params) {
      jQuery.ajax = old_ajax;
      params.success({ });
    });

    basemap_dialog.mapboxPane.checkTileJson($url.val(), $access_token.val());

    setTimeout(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
      var layer = basemap_dialog._successChooser.calls.argsFor(0)[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v4/" + mapboxid + "/{z}/{x}/{y}.png?access_token=" + access_token);
      done()
    }, 500);

  });

  it("should give an error", function(done) {

    basemap_dialog.render();
    spyOn(basemap_dialog.mapboxPane, '_errorChooser');

    var mapboxid = "cartodb.map-eeoepub0";
    var $url = basemap_dialog.mapboxPane.$("input[name='url']").val("http://a.tiles.mapbox.com/v4/" + mapboxid + "/page.html");

    basemap_dialog.mapboxPane.checkTileJson($url.val());

    setTimeout(function() {
      expect(basemap_dialog.mapboxPane._errorChooser).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should send mapbox url if user provides the mapbox xyz url and access token", function(done) {
    spyOn(basemap_dialog, '_successChooser');
    basemap_dialog.render();

    var mapboxid = "cartodb.map-eeoepub0";
    var access_token = "ACCESS_TOKEN";

    var $url = basemap_dialog.mapboxPane.$("input[name='url']").val("http://d.tiles.mapbox.com/v4/" + mapboxid + "/{z}/{y}/{z}.png");
    var $access_token = basemap_dialog.mapboxPane.$("input[name='access_token']").val(access_token);

    var old_ajax = jQuery.ajax;
    var spy = spyOn(jQuery, 'ajax').and.callFake(function(params) {
      jQuery.ajax = old_ajax;
      params.success({ });
    });

    basemap_dialog.mapboxPane.checkTileJson($url.val(), $access_token.val());

    setTimeout(function() {
      expect(basemap_dialog._successChooser).toHaveBeenCalled();
      var layer = basemap_dialog._successChooser.calls.argsFor(0)[0];
      expect(layer.get('urlTemplate')).toEqual("https://a.tiles.mapbox.com/v4/" + mapboxid + "/{z}/{x}/{y}.png?access_token=" + access_token);
      done();
    }, 500);

  });

  it("should show an error if the mapbox tile doesn't exist", function(done) {
    spyOn(basemap_dialog, '_errorChooser');
    basemap_dialog.render();

    var mapboxid = "token-token-token";
    var access_token = "ACCESS_TOKEN";

    var $url = basemap_dialog.mapboxPane.$("input[name='url']").val("http://a.tiles.mapbox.com/v4/" + mapboxid + "/{z}/{x}/{y}.png/error");
    var $access_token = basemap_dialog.mapboxPane.$("input[name='access_token']").val(access_token);

    var img = null;
    var OldImage = window.Image;
    spyOn(window, 'Image').and.callFake( function() {
        img = new OldImage();
        return img;
    });

    basemap_dialog.mapboxPane.checkTileJson($url.val(), $access_token.val());
    img.onerror();

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

    var val = basemap_dialog.zxyPane.$el.find("input").val("this_is_not_the_basemap_your_looking.for");

    basemap_dialog.zxyPane.checkTileJson(val.val());

    setTimeout(function() {
      expect(basemap_dialog._errorChooser).toHaveBeenCalled();
      done();
    }, 500);
  });

  it("should show a warning if the xyz tile has the right format but is not valid", function() {
    basemap_dialog.render();
    spyOn(basemap_dialog.zxyPane, '_warningChooser');

    var layer = new cdb.admin.TileLayer();
    spyOn(layer, 'validateTemplateURL');
    basemap_dialog.zxyPane._checkTile(layer);
    expect(layer.validateTemplateURL).toHaveBeenCalled();

    layer.validateTemplateURL.calls.argsFor(0)[0].error();

    expect(basemap_dialog.zxyPane._warningChooser).toHaveBeenCalled();
  });

  it("should return a new layer when add a correct image xyz url", function() {
    spyOn(basemap_dialog, 'hide');
    basemap_dialog.render();

    var layer = new cdb.admin.TileLayer({
      urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
    });

    basemap_dialog.zxyPane._successChooser(layer);
    expect(basemap_dialog.options.baseLayers.size()).toBe(1);
    expect(basemap_dialog.hide).toHaveBeenCalled();
  });

  it("should return a new layer when add a correct image xyz url without https", function() {
    spyOn(basemap_dialog, 'hide');
    basemap_dialog.render();

    var layer = new cdb.admin.TileLayer({
      urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
    });
    basemap_dialog.zxyPane._successChooser(layer);
    expect(basemap_dialog.options.baseLayers.size()).toBe(1);
    expect(basemap_dialog.hide).toHaveBeenCalled();
  });

});

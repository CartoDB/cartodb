describe("Basemap WMS dialog", function() {

  var view;

  beforeEach(function() {

    cdb.admin.WMSService.prototype._PROXY_URL = 'http://cartodb-wms.global.ssl.fastly.net/api';
    cdb.admin.WMSService.prototype._PROXY_TILES = 'http://cartodb-wms.global.ssl.fastly.net/mapproxy';

    view = new cdb.admin.WMSBasemapChooserPane();
  });

  it("should trigger a success event if the WMS is valid", function(done) {

    var success = false;

    view.bind("chooseWMSLayers", function() {
      success = true;
    });

    var url = "http://geodata.nationaalgeoregister.nl/bevolkingskernen2008/wms";
    view.checkTileJson(url);

    setTimeout(function() {
      expect(success).toEqual(true);
      done();
    }, 500);

  });

  it("should trigger an error if the WMS is invalid", function(done) {

    var error = false;

    view.bind("errorChooser", function() {
      error = true;
    });

    var url = "I'm not an URL, you know";

    view.checkTileJson(url);

    setTimeout(function() {
      expect(error).toEqual(true);
      done();
    }, 500);

  });

});


describe("Basemap WMS dialog", function() {

  var view;

  beforeEach(function() {

    cdb.admin.WMSService.prototype._PROXY_URL = 'http://cartodb-wms.global.ssl.fastly.net/api';
    cdb.admin.WMSService.prototype._PROXY_TILES = 'http://cartodb-wms.global.ssl.fastly.net/mapproxy';

    view = new cdb.admin.WMSBasemapChooserPane();
  });

  it("should trigger a success event if the WMS is valid", function(done) {

    view.bind("chooseWMSLayers", function() {
      expect(true).toEqual(true);
      done();
    });

    var url = "http://geodata.nationaalgeoregister.nl/bevolkingskernen2008/wms";
    view.checkTileJson(url);

  });

  it("should trigger an error if the WMS is invalid", function(done) {

    view.bind("errorChooser", function() {
      expect(true).toEqual(true);
      done();
    });

    var url = "I'm not an URL, you know";

    view.checkTileJson(url);

  });

});

